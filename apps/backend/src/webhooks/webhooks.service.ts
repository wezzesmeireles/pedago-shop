import {
  Injectable, Inject, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaClient, WebhookStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PRISMA } from '../database/database.module';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleMercadoPago(
    rawBody: Buffer,
    headers: Record<string, string>,
    query: Record<string, string>,
  ) {
    const signature = headers['x-signature'];
    const requestId = headers['x-request-id'];

    if (signature) {
      this.verifySignature(rawBody, signature, requestId, query['data.id']);
    }

    const body = JSON.parse(rawBody.toString());
    const eventType: string = body.type ?? body.action ?? '';
    const dataId: string = body.data?.id ?? query['data.id'] ?? '';
    const eventId = `${eventType}:${dataId}`;

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { source_eventId: { source: 'mercadopago', eventId } },
    });
    if (existing) {
      this.logger.log(`Duplicate webhook skipped: mercadopago:${eventId}`);
      return { received: true };
    }

    const event = await this.prisma.webhookEvent.create({
      data: {
        source: 'mercadopago',
        eventId,
        eventType,
        payload: body,
        status: WebhookStatus.processing,
      },
    });

    try {
      if (eventType === 'payment' && dataId) {
        await this.processPayment(dataId, event.id);
      }

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: WebhookStatus.processed, processedAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Webhook processing failed: ${err.message}`, err.stack);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: WebhookStatus.failed, errorMessage: err.message },
      });
    }

    return { received: true };
  }

  private async processPayment(paymentId: string, _eventId: string) {
    const order = await this.prisma.order.findFirst({
      where: { mpPaymentId: paymentId },
    });

    if (!order) {
      const cfg = await this.prisma.siteConfig.findUnique({ where: { key: 'global' } });
      const accessToken = (cfg?.value as any)?.mercadoPagoAccessToken?.trim()
        || this.config.get<string>('mercadoPago.accessToken') || '';

      if (!accessToken) {
        this.logger.warn(`No access token to fetch payment ${paymentId}`);
        return;
      }

      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new BadRequestException(`MP payment fetch failed: ${res.status}`);

      const data = await res.json();
      const externalRef: string = data.external_reference;
      if (!externalRef) return;

      const orderByRef = await this.prisma.order.findUnique({ where: { id: externalRef } });
      if (!orderByRef) return;

      if (data.status === 'approved') {
        await this.ordersService.markAsPaid(orderByRef.id, String(paymentId), data.status);
        await this.sendTelegramNotification(orderByRef);
      }
    } else {
      const cfg = await this.prisma.siteConfig.findUnique({ where: { key: 'global' } });
      const accessToken = (cfg?.value as any)?.mercadoPagoAccessToken?.trim()
        || this.config.get<string>('mercadoPago.accessToken') || '';

      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'approved') {
        await this.ordersService.markAsPaid(order.id, String(paymentId), data.status);
        await this.sendTelegramNotification(order);
      }
    }
  }

  private async sendTelegramNotification(order: any) {
    const cfg = await this.prisma.siteConfig.findUnique({ where: { key: 'global' } });
    const botToken: string = (cfg?.value as any)?.telegramBotToken ?? '';
    const chatId: string = (cfg?.value as any)?.telegramChatId ?? '';
    if (!botToken || !chatId) return;

    const text = `✅ *Pedido pago!*\n🔖 ${order.orderNumber}\n👤 ${order.customerName}\n💰 R$ ${Number(order.totalAmount).toFixed(2)}`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    }).catch(() => {});
  }

  private verifySignature(
    rawBody: Buffer,
    signature: string,
    requestId: string,
    dataId: string,
  ) {
    const secret = this.config.get<string>('mercadoPago.webhookSecret');
    if (!secret) return;

    const parts = Object.fromEntries(
      signature.split(',').map(p => p.split('=')),
    );
    const ts = parts['ts'];
    const hash = parts['v1'];
    if (!ts || !hash) throw new BadRequestException('Invalid signature format.');

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) {
      throw new BadRequestException('Invalid webhook signature.');
    }
  }
}
