import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpMessagePublisher } from '../../../messaging/interfaces/amqp-message-publisher.interface';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER, AMQP_PUBLISHER } from '../../rabbitmq.constants';
import { Exchanges, Queues, RoutingKeys } from '../../topology';

@Injectable()
export class InvoiceService implements OnModuleInit {
  constructor(
    @Inject(AMQP_PUBLISHER)
    private readonly publisher: AmqpMessagePublisher,
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(Queues.INVOICE_PAYMENT_APPROVED, (message) =>
      this.issue(JSON.parse(message.payload)),
    );
  }

  private async issue(order: OrderPayload): Promise<void> {
    if (order.simulate === 'invoice_failed') {
      console.log(`[INVOICE] ${order.orderId} failed`);
      await this.publisher.publish({
        destination: Exchanges.INVOICE,
        routingKey: RoutingKeys.INVOICE_FAILED,
        key: order.orderId,
        payload: { ...order, reason: 'Invoice emission failed' },
      });
      return;
    }

    console.log(`[INVOICE] ${order.orderId} issued`);
    await this.publisher.publish({
      destination: Exchanges.INVOICE,
      routingKey: RoutingKeys.INVOICE_ISSUED,
      key: order.orderId,
      payload: order,
    });
  }
}
