import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * MP payment status → our OrderStatus mapping
 *
 * MP statuses: pending | approved | authorized | in_process | in_mediation
 *              rejected | cancelled | refunded | charged_back
 */
const MP_STATUS_MAP: Record<string, string> = {
  approved: 'PAID',
  in_process: 'AWAITING_PAYMENT', // pix waiting bank confirmation
  pending: 'AWAITING_PAYMENT',    // newly created, not yet paid
  authorized: 'AWAITING_PAYMENT', // captured but not settled yet
  rejected: 'CANCELLED',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED',
  charged_back: 'REFUNDED',
};

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private config: ConfigService,
  ) {}

  async handleMercadoPago(req: Request) {
    const xSignature = req.headers['x-signature'] as string | undefined;
    const xRequestId = req.headers['x-request-id'] as string | undefined;
    const { id: queryId, topic, type: queryType } = req.query as {
      id?: string;
      topic?: string;
      type?: string;
    };

    // ── Signature verification ────────────────────────────────────────────────
    const webhookSecret = await this.payments.getWebhookSecret();
    if (xSignature && !this.verifySignature(xSignature, queryId, xRequestId, webhookSecret)) {
      this.logger.warn('Invalid MP webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const body = req.body ?? {};
    const paymentId = body?.data?.id ?? queryId;
    const eventType = body?.type ?? queryType ?? topic ?? 'payment';

    this.logger.log(`Webhook: type=${eventType} paymentId=${paymentId} requestId=${xRequestId}`);

    // ── Only handle payment events ────────────────────────────────────────────
    // merchant_order events are informational; we handle payments directly
    if (!paymentId || !['payment'].includes(eventType)) {
      return;
    }

    // ── Idempotency: deduplicate by paymentId+action ──────────────────────────
    const eventId = `${paymentId}`;
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { source_eventId: { source: 'mercadopago', eventId } },
    });
    if (existing?.status === 'processed') {
      this.logger.log(`Duplicate webhook ignored: paymentId=${paymentId}`);
      return;
    }

    // Upsert: create if new, update if previously failed
    await this.prisma.webhookEvent.upsert({
      where: { source_eventId: { source: 'mercadopago', eventId } },
      create: {
        source: 'mercadopago',
        eventId,
        eventType,
        payload: body,
        status: 'processing',
      },
      update: { status: 'processing', payload: body },
    });

    try {
      const payment = await this.payments.getPayment(paymentId);
      const mpStatus = payment.status ?? 'unknown';
      const orderId = payment.external_reference;

      this.logger.log(
        `MP payment ${paymentId}: status=${mpStatus} status_detail=${payment.status_detail} order=${orderId}`,
      );

      await this.handlePaymentStatus(payment, mpStatus, orderId);

      await this.prisma.webhookEvent.update({
        where: { source_eventId: { source: 'mercadopago', eventId } },
        data: { status: 'processed' },
      });
    } catch (error) {
      await this.prisma.webhookEvent
        .update({
          where: { source_eventId: { source: 'mercadopago', eventId } },
          data: { status: 'failed', errorMessage: String(error) },
        })
        .catch(() => {});
      throw error;
    }
  }

  // ─── Status dispatch ─────────────────────────────────────────────────────────

  private async handlePaymentStatus(payment: any, mpStatus: string, orderId?: string) {
    if (!orderId) {
      this.logger.warn(`Payment ${payment.id} has no external_reference, skipping`);
      return;
    }

    if (mpStatus === 'approved') {
      await this.processApprovedPayment(payment, orderId);
    } else if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
      await this.processRefundedPayment(payment, orderId, mpStatus);
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      await this.processCancelledPayment(payment, orderId, mpStatus);
    }
    // pending / in_process / authorized → no action needed, order stays AWAITING_PAYMENT
  }

  // ─── Approved ────────────────────────────────────────────────────────────────

  private async processApprovedPayment(payment: any, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      this.logger.warn(`Order not found: ${orderId}`);
      return;
    }
    if (order.status === 'PAID') {
      this.logger.log(`Order already paid: ${orderId}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          mpPaymentId: String(payment.id),
          mpStatus: payment.status,
          paidAt: new Date(),
          paymentMethod: payment.payment_type_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
        },
      });

      // Downloads ficam disponíveis para sempre (30 anos), sem limite de quantidade
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setFullYear(tokenExpiresAt.getFullYear() + 30);

      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          await tx.downloadToken.create({
            data: {
              orderId,
              orderItemId: item.id,
              maxDownloads: 99999,
              expiresAt: tokenExpiresAt,
            },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { salesCount: { increment: item.quantity } },
        });
      }
    });

    this.logger.log(`Order ${orderId} PAID — download tokens created`);
  }

  // ─── Refunded / Charged back ─────────────────────────────────────────────────

  private async processCancelledPayment(payment: any, orderId: string, mpStatus: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!order || order.status === 'PAID') return; // never cancel an already-paid order

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        mpPaymentId: String(payment.id),
        mpStatus,
      },
    });
    this.logger.log(`Order ${orderId} CANCELLED (mp_status=${mpStatus})`);
  }

  private async processRefundedPayment(payment: any, orderId: string, mpStatus: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!order) return;

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        mpStatus,
      },
    });

    // Revoke all download tokens for this order
    await this.prisma.downloadToken.updateMany({
      where: { orderId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Order ${orderId} REFUNDED — download tokens revoked`);
  }

  // ─── Signature verification ───────────────────────────────────────────────────

  /**
   * Verifies the x-signature header sent by Mercado Pago.
   *
   * Format: ts=<unix_ts>,v1=<hmac_hex>
   * Manifest: "id:<queryId>;request-id:<xRequestId>;ts:<ts>;"
   *
   * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
   */
  private verifySignature(
    xSignature: string,
    queryId?: string,
    xRequestId?: string,
    secret?: string,
  ): boolean {
    if (!secret) {
      // In dev without a secret configured, skip verification
      this.logger.warn('MP webhook secret not configured — skipping signature check');
      return true;
    }

    try {
      const parts = xSignature.split(',');
      const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

      if (!ts || !v1) {
        this.logger.warn('x-signature missing ts or v1 parts');
        return false;
      }

      // Reject requests older than 5 minutes (replay protection)
      const requestTime = parseInt(ts, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - requestTime) > 300) {
        this.logger.warn(`Webhook timestamp too old: ts=${ts} now=${now}`);
        return false;
      }

      const manifest = `id:${queryId ?? ''};request-id:${xRequestId ?? ''};ts:${ts};`;
      const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex');

      // Constant-time comparison to prevent timing attacks
      const expectedBuf = Buffer.from(expectedHash, 'hex');
      const receivedBuf = Buffer.from(v1, 'hex');

      if (expectedBuf.length !== receivedBuf.length) return false;
      return timingSafeEqual(expectedBuf, receivedBuf);
    } catch (err) {
      this.logger.error('Signature verification error', err);
      return false;
    }
  }
}
