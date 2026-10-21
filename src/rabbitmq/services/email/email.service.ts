import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import { ServiceActivity } from '../../control/service-activity';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER } from '../../rabbitmq.constants';
import { Queues } from '../../topology';

const MAX_RAW_PAYLOAD = 120;

@Injectable()
export class EmailService implements OnModuleInit {
  constructor(
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
    private readonly activity: ServiceActivity,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(
      Queues.EMAIL_INVOICE_ISSUED,
      async (message) => {
        const order: OrderPayload = JSON.parse(message.payload);
        this.activity.record(
          'confirmation',
          `Confirmation sent for order ${order.orderId}`,
          {
            orderId: order.orderId,
            subject: `Order ${order.orderId} confirmed`,
          },
        );
      },
    );

    await this.consumer.consume(Queues.EMAIL_ORDER_FAILED, async (message) => {
      const order: OrderPayload = JSON.parse(message.payload);
      this.activity.record(
        'failure',
        `Failure notice for order ${order.orderId} ` +
          `(${message.routingKey}: ${order.reason ?? 'no reason'})`,
        { orderId: order.orderId, subject: `Order ${order.orderId} failed` },
      );
    });

    await this.consumer.consume(Queues.DEAD_LETTER, async (message) => {
      this.activity.record(
        'invalid',
        `Invalid message discarded: ${message.payload.slice(0, MAX_RAW_PAYLOAD)}`,
        { subject: 'Invalid message received' },
      );
    });
  }
}
