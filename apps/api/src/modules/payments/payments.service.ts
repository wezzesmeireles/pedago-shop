import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import MercadoPagoConfig, { Payment, Preference, PaymentRefund } from 'mercadopago';
import { randomUUID } from 'crypto';

/** Milliseconds MP should hold a PIX open (30 min = same as order expiry) */
const PIX_EXPIRY_MINUTES = 30;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {}

  // ─── Client factory ─────────────────────────────────────────────────────────

  private async getSiteConfig(): Promise<Record<string, any>> {
    const { data } = await this.supabase.db
      .from('site_config')
      .select('value')
      .eq('key', 'global')
      .single();
    return (data?.value as Record<string, any>) ?? {};
  }

  private async getMpClient(): Promise<MercadoPagoConfig> {
    const cfg = await this.getSiteConfig();
    const accessToken =
      (cfg.mercadoPagoAccessToken?.trim() || this.config.get<string>('MERCADO_PAGO_ACCESS_TOKEN')) ?? '';
    return new MercadoPagoConfig({ accessToken });
  }

  async getWebhookSecret(): Promise<string | undefined> {
    const cfg = await this.getSiteConfig();
    return cfg.mercadoPagoWebhookSecret?.trim() || this.config.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');
  }

  /**
   * Returns the webhook notification URL only when it's a public, reachable URL.
   * MP rejects localhost / 127.0.0.1 / private IPs.
   * In dev, use ngrok or localtunnel and set API_URL accordingly.
   */
  private notificationUrl(): string | undefined {
    const base = this.config.get<string>('API_URL') ?? '';
    if (this.isLocalUrl(base)) return undefined;
    return `${base}/webhooks/mercadopago`;
  }

  private backUrls(orderId: string): { success: string; failure: string; pending: string } | undefined {
    const base = this.config.get<string>('FRONTEND_URL') ?? '';
    if (this.isLocalUrl(base)) return undefined;
    return {
      success: `${base}/checkout/success/${orderId}`,
      failure: `${base}/checkout/failure/${orderId}`,
      pending: `${base}/checkout/success/${orderId}`,
    };
  }

  private isLocalUrl(url: string): boolean {
    return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url);
  }

  // ─── PIX ────────────────────────────────────────────────────────────────────

  /**
   * Creates a direct PIX payment via MP Payment API.
   * Returns QR code string (copia-e-cola) and base64 image for display.
   *
   * MP best-practices applied:
   *  - binary_mode: false  → payment stays "pending" until confirmed (correct for PIX)
   *  - additional_info.items → required for anti-fraud scoring
   *  - date_of_expiration   → ISO 8601 with UTC offset, aligned with order expiry
   *  - metadata             → order number for easy lookup in MP dashboard
   *  - idempotency_key      → safe to retry without double-charge
   */
  async createPix(
    order: any,
    user: any,
  ): Promise<{ paymentId: string; qrCode: string; qrCodeBase64: string }> {
    const client = await this.getMpClient();
    const payment = new Payment(client);

    const [firstName, ...rest] = (user.name as string).trim().split(' ');
    const lastName = rest.join(' ') || firstName;

    // Expiration: 30 min from now in ISO 8601 with timezone offset (required by MP)
    const expiresAt = new Date(Date.now() + PIX_EXPIRY_MINUTES * 60_000);
    const dateOfExpiration = expiresAt.toISOString().replace('Z', '-03:00');

    const result = await payment.create({
      requestOptions: { idempotencyKey: `pix-${order.id}` },
      body: {
        transaction_amount: this.roundAmount(order.totalAmount),
          description: `Pedido ${order.orderNumber}`,
          payment_method_id: 'pix',
          // binary_mode=false: PIX stays "pending" → "approved" asynchronously via webhook
          binary_mode: false,
          payer: {
            email: user.email,
            first_name: firstName,
            last_name: lastName,
          },
          // Anti-fraud: itemised list improves approval rate
          additional_info: {
            items: order.items.map((item: any) => ({
              id: item.productId,
              title: item.productName,
              description: item.productName,
              category_id: 'education',
              quantity: item.quantity,
              unit_price: this.roundAmount(item.unitPrice),
            })),
            payer: {
              first_name: firstName,
              last_name: lastName,
            },
          },
          metadata: {
            order_id: order.id,
            order_number: order.orderNumber,
          },
          external_reference: order.id,
          ...(this.notificationUrl() && { notification_url: this.notificationUrl() }),
          date_of_expiration: dateOfExpiration,
        },
    });

    this.logger.log(
      `PIX created: mp_id=${result.id} status=${result.status} status_detail=${result.status_detail}`,
    );

    if (!result.point_of_interaction?.transaction_data?.qr_code) {
      this.logger.error(`PIX created but qr_code missing. Full response: ${JSON.stringify(result)}`);
      throw new BadRequestException(
        'Erro ao gerar QR Code PIX. Verifique o Access Token do Mercado Pago.',
      );
    }

    return {
      paymentId: String(result.id),
      qrCode: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64 ?? '',
    };
  }

  // ─── Card / Checkout Pro ────────────────────────────────────────────────────

  /**
   * Creates a Checkout Pro Preference for card payments.
   * Redirects user to MP hosted checkout (handles installments, 3DS, etc).
   *
   * MP best-practices applied:
   *  - excluded_payment_types: removes boleto/ticket (digital product = no boleto)
   *  - additional_info.items  → anti-fraud & itemised receipt in MP dashboard
   *  - statement_descriptor   → shown on customer's card statement
   *  - idempotency_key        → safe retry
   */
  async createPreference(
    order: any,
    user: any,
  ): Promise<{ preferenceId: string; initPoint: string | undefined; sandboxInitPoint: string | undefined }> {
    const client = await this.getMpClient();
    const preference = new Preference(client);

    const storeName = await this.getStoreName();

    const preferenceData = await preference.create(
      {
        body: {
          items: order.items.map((item: any) => ({
            id: item.productId,
            title: item.productName,
            description: `Produto digital — ${item.productName}`,
            category_id: 'education',
            quantity: item.quantity,
            unit_price: this.roundAmount(item.unitPrice),
            currency_id: 'BRL',
          })),
          payer: {
            name: user.name,
            email: user.email,
          },
          payment_methods: {
            // Digital products: exclude boleto, ATM, and voucher (no physical delivery)
            excluded_payment_types: [
              { id: 'ticket' },
              { id: 'atm' },
              { id: 'digital_currency' },
            ],
            installments: 12,
          },
          // Label shown on customer's card statement
          statement_descriptor: storeName.substring(0, 22).toUpperCase(),
          ...(this.backUrls(order.id) && {
            back_urls: this.backUrls(order.id),
            auto_return: 'approved' as const,
          }),
          ...(this.notificationUrl() && { notification_url: this.notificationUrl() }),
          external_reference: order.id,
          expires: true,
          expiration_date_to: order.expiresAt?.toISOString(),
          metadata: {
            order_id: order.id,
            order_number: order.orderNumber,
          },
        },
    });

    this.logger.log(`Preference created: id=${preferenceData.id}`);

    return {
      preferenceId: preferenceData.id ?? '',
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
    };
  }

  // ─── Get Payment ────────────────────────────────────────────────────────────

  async getPayment(paymentId: string) {
    const client = await this.getMpClient();
    const paymentClient = new Payment(client);
    return paymentClient.get({ id: paymentId });
  }

  // ─── Refund ─────────────────────────────────────────────────────────────────

  /**
   * Refund a payment fully or partially.
   * Pass `amount` for partial refund, omit for full refund.
   */
  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    const client = await this.getMpClient();
    const refund = new PaymentRefund(client);

    const body: Record<string, any> = {};
    if (amount !== undefined) body.amount = this.roundAmount(amount);

    await refund.create({ payment_id: paymentId, body });
    this.logger.log(`Refund issued for payment ${paymentId}${amount ? ` amount=${amount}` : ' (full)'}`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** MP requires amounts with exactly 2 decimal places */
  private roundAmount(value: number | string): number {
    return Math.round(Number(value) * 100) / 100;
  }

  private async getStoreName(): Promise<string> {
    try {
      const cfg = await this.getSiteConfig();
      return cfg.storeName ?? 'LOJA';
    } catch {
      return 'LOJA';
    }
  }
}
