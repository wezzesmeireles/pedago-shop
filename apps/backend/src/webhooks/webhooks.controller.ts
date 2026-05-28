import {
  Controller, Post, Req, Headers, Query, RawBodyRequest,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('mercadopago')
  handleMercadoPago(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string>,
  ) {
    return this.webhooksService.handleMercadoPago(
      req.rawBody ?? Buffer.from(JSON.stringify(req.body)),
      headers,
      query,
    );
  }
}
