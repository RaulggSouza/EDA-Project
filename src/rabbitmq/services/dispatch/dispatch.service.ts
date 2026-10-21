import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER } from '../../rabbitmq.constants';
import { Queues } from '../../topology';

@Injectable()
export class DispatchService implements OnModuleInit {
  constructor(
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(
      Queues.DISPATCH_INVOICE_ISSUED,
      async (message) => {
        const order: OrderPayload = JSON.parse(message.payload);
        console.log(`[DISPATCH] Shipping started for order ${order.orderId}`);
      },
    );
  }
}
