import { Inject, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

import { MESSAGE_PUBLISHER } from '../messaging/messaging.constants';

import type { MessagePublisher } from '../messaging/interfaces/message-publisher.interface';

export interface IncomingOrderWebhook {
  eventId: string;
  orderId: string;
  message?: string;
}

export type WebhookResult =
  | {
      accepted: true;
      duplicate: false;
      eventId: string;
      orderId: string;
      publishedTo: string;
      explanation: string;
    }
  | {
      accepted: true;
      duplicate: true;
      eventId: string;
      orderId: string;
      publishedTo: null;
      explanation: string;
    };

@Injectable()
export class OrdersWebhookService {
  private readonly processedEvents = new Set<string>();

  private readonly secret = process.env.WEBHOOK_SECRET ?? 'tutorial-secret';

  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
  ) {}

  isValidSender(token?: string): boolean {
    if (!token) {
      return false;
    }

    const expected = Buffer.from(this.secret);
    const received = Buffer.from(token);

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  async handleOrder(order: IncomingOrderWebhook): Promise<WebhookResult> {
    if (this.processedEvents.has(order.eventId)) {
      return {
        accepted: true,
        duplicate: true,
        eventId: order.eventId,
        orderId: order.orderId,
        publishedTo: null,
        explanation: 'Evento duplicado. A publicação no Kafka foi ignorada.',
      };
    }

    await this.publisher.publish({
      destination: 'orders',
      key: order.orderId,
      payload: JSON.stringify({
        eventId: order.eventId,
        orderId: order.orderId,
        message: order.message ?? 'Pedido recebido pelo webhook',
        source: 'orders-webhook',
      }),
    });

    this.processedEvents.add(order.eventId);

    return {
      accepted: true,
      duplicate: false,
      eventId: order.eventId,
      orderId: order.orderId,
      publishedTo: 'orders',
      explanation: 'Emissor autenticado. Evento novo publicado no Kafka.',
    };
  }
}
