import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: config.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmation(order: any) {
    const frontendUrl = this.config.get('FRONTEND_URL');
    const itemsHtml = order.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${item.downloadTokens
              ?.map(
                (t: any) =>
                  `<a href="${frontendUrl}/downloads/${t.token}" style="color: #7C3AED; font-weight: bold;">Baixar PDF</a>`,
              )
              .join('<br>')}
          </td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Pagamento Confirmado! 🎉</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Seus arquivos estão prontos para download</p>
        </div>

        <p>Olá, <strong>${order.user?.name || order.customerName}</strong>!</p>
        <p>Seu pedido <strong>#${order.orderNumber}</strong> foi confirmado. Clique nos links abaixo para baixar seus arquivos:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Produto</th>
              <th style="padding: 8px; text-align: left;">Valor</th>
              <th style="padding: 8px; text-align: left;">Download</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Dica:</strong> Você também pode acessar seus downloads a qualquer momento em
            <a href="${frontendUrl}/minha-conta/downloads" style="color: #7C3AED;">${frontendUrl}/minha-conta/downloads</a>
          </p>
        </div>

        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          Pedago Shop • Em caso de dúvidas, responda este email.
        </p>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to: order.customerEmail || order.user?.email,
        subject: `✅ Pedido ${order.orderNumber} confirmado - Seus downloads estão prontos!`,
        html,
      });
      this.logger.log(`Confirmation email sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send email for order ${order.orderNumber}`, error);
      throw error;
    }
  }
}
