import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { OrdersWebhookService } from './orders-webhook.service';
import type { IncomingOrderWebhook } from './orders-webhook.service';

@Controller('webhooks')
export class OrdersWebhookController {
  constructor(private readonly webhookService: OrdersWebhookService) {}

  @Post('orders')
  @HttpCode(200)
  async receiveOrder(
    @Headers('x-webhook-token') token: string | undefined,
    @Body() body: IncomingOrderWebhook,
  ) {
    if (!this.webhookService.isValidSender(token)) {
      throw new UnauthorizedException({
        accepted: false,
        step: 'sender-validation',
        explanation:
          'Emissor não autenticado. O pedido foi rejeitado antes de chegar às mensagerias.',
      });
    }

    if (
      !body ||
      typeof body.eventId !== 'string' ||
      !body.eventId.trim() ||
      typeof body.orderId !== 'string' ||
      !body.orderId.trim()
    ) {
      throw new BadRequestException({
        accepted: false,
        step: 'payload-validation',
        explanation: 'O evento precisa conter eventId e orderId válidos.',
      });
    }

    return this.webhookService.handleOrder(body);
  }
}
