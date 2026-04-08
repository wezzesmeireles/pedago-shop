import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private supabase: SupabaseService,
    private payments: PaymentsService,
    private config: ConfigService,
  ) {}

  async handleMercadoPago(req: Request) {
    const xSignature = req.headers['x-signature'] as string | undefined;
    const xRequestId = req.headers['x-request-id'] as string | undefined;
    const { id: queryId, topic, type: queryType } = req.query as Record<string, string>;

    const webhookSecret = await this.payments.getWebhookSecret();
    if (xSignature && !this.verifySignature(xSignature, queryId, xRequestId, webhookSecret)) {
      this.logger.warn('Invalid MP webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const body = req.body ?? {};
    const paymentId = body?.data?.id ?? queryId;
    const eventType = body?.type ?? queryType ?? topic ?? 'payment';

    this.logger.log(`Webhook: type=${eventType} paymentId=${paymentId}`);

    if (!paymentId || !['payment'].includes(eventType)) return;

    const eventId = `${paymentId}`;
    const { data: existing } = await this.supabase.db
      .from('webhook_events')
      .select('status')
      .eq('source', 'mercadopago')
      .eq('event_id', eventId)
      .single();

    if (existing?.status === 'processed') {
      this.logger.log(`Duplicate webhook ignored: paymentId=${paymentId}`);
      return;
    }

    await this.supabase.db
      .from('webhook_events')
      .upsert(
        { source: 'mercadopago', event_id: eventId, event_type: eventType, payload: body, status: 'processing' },
        { onConflict: 'source,event_id' },
      );

    try {
      const payment = await this.payments.getPayment(paymentId);
      const mpStatus = payment.status ?? 'unknown';
      const orderId = payment.external_reference;

      this.logger.log(`MP payment ${paymentId}: status=${mpStatus} order=${orderId}`);

      await this.handlePaymentStatus(payment, mpStatus, orderId);

      await this.supabase.db
        .from('webhook_events')
        .update({ status: 'processed' })
        .eq('source', 'mercadopago')
        .eq('event_id', eventId);
    } catch (error) {
      await this.supabase.db
        .from('webhook_events')
        .update({ status: 'failed', error_message: String(error) })
        .eq('source', 'mercadopago')
        .eq('event_id', eventId);
      throw error;
    }
  }

  private async handlePaymentStatus(payment: any, mpStatus: string, orderId?: string) {
    if (!orderId) return;

    if (mpStatus === 'approved') await this.processApprovedPayment(payment, orderId);
    else if (mpStatus === 'refunded' || mpStatus === 'charged_back') await this.processRefundedPayment(payment, orderId, mpStatus);
    else if (mpStatus === 'rejected' || mpStatus === 'cancelled') await this.processCancelledPayment(payment, orderId, mpStatus);
  }

  private async processApprovedPayment(payment: any, orderId: string) {
    const { data: order } = await this.supabase.db
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', orderId)
      .single();

    if (!order) { this.logger.warn(`Order not found: ${orderId}`); return; }
    if (order.status === 'PAID') { this.logger.log(`Order already paid: ${orderId}`); return; }

    await this.supabase.db
      .from('orders')
      .update({
        status: 'PAID',
        mp_payment_id: String(payment.id),
        mp_status: payment.status,
        paid_at: new Date().toISOString(),
        payment_method: payment.payment_type_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setFullYear(tokenExpiresAt.getFullYear() + 30);

    for (const item of order.order_items) {
      for (let i = 0; i < item.quantity; i++) {
        await this.supabase.db.from('download_tokens').insert({
          order_id: orderId,
          order_item_id: item.id,
          max_downloads: 99999,
          expires_at: tokenExpiresAt.toISOString(),
        });
      }
      await this.supabase.db
        .from('products')
        .update({ sales_count: (item.products?.sales_count ?? 0) + item.quantity })
        .eq('id', item.product_id);
    }

    this.logger.log(`Order ${orderId} PAID — download tokens created`);
  }

  private async processCancelledPayment(payment: any, orderId: string, mpStatus: string) {
    const { data: order } = await this.supabase.db.from('orders').select('id, status').eq('id', orderId).single();
    if (!order || order.status === 'PAID') return;

    await this.supabase.db
      .from('orders')
      .update({ status: 'CANCELLED', mp_payment_id: String(payment.id), mp_status: mpStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    this.logger.log(`Order ${orderId} CANCELLED`);
  }

  private async processRefundedPayment(payment: any, orderId: string, mpStatus: string) {
    const { data: order } = await this.supabase.db.from('orders').select('id').eq('id', orderId).single();
    if (!order) return;

    await this.supabase.db
      .from('orders')
      .update({ status: 'REFUNDED', mp_status: mpStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    await this.supabase.db
      .from('download_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .is('revoked_at', null);

    this.logger.log(`Order ${orderId} REFUNDED — tokens revoked`);
  }

  private verifySignature(xSignature: string, queryId?: string, xRequestId?: string, secret?: string): boolean {
    if (!secret) { this.logger.warn('MP webhook secret not configured'); return true; }
    try {
      const parts = xSignature.split(',');
      const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];
      if (!ts || !v1) return false;
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(ts, 10)) > 300) return false;
      const manifest = `id:${queryId ?? ''};request-id:${xRequestId ?? ''};ts:${ts};`;
      const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex');
      const expectedBuf = Buffer.from(expectedHash, 'hex');
      const receivedBuf = Buffer.from(v1, 'hex');
      if (expectedBuf.length !== receivedBuf.length) return false;
      return timingSafeEqual(expectedBuf, receivedBuf);
    } catch { return false; }
  }
}
