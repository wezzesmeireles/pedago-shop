import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private svc: WebhooksService) {}

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPago(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      await this.svc.handleMercadoPago(req);
      return { received: true };
    } catch (error) {
      this.logger.error('Webhook error', error);
      // Always return 200 to avoid MP retries for processing errors
      // (signature failures still return 400)
      return { received: false };
    }
  }
}
