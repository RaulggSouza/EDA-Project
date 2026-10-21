import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER } from '../../rabbitmq.constants';
import { Queues } from '../../topology';

@Injectable()
export class EmailService implements OnModuleInit {
  constructor(
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(Queues.EMAIL_INVOICE_ISSUED, async (message) => {
      const order: OrderPayload = JSON.parse(message.payload);
      console.log(`[EMAIL] Confirmation sent for order ${order.orderId}`);
    });

    await this.consumer.consume(Queues.EMAIL_ORDER_FAILED, async (message) => {
      const order: OrderPayload = JSON.parse(message.payload);
      console.log(
        `[EMAIL] Failure notice for order ${order.orderId} ` +
          `(${message.routingKey}: ${order.reason ?? 'no reason'})`,
      );
    });
  }
}
