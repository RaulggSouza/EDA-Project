import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpMessagePublisher } from '../../../messaging/interfaces/amqp-message-publisher.interface';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER, AMQP_PUBLISHER } from '../../rabbitmq.constants';
import { Exchanges, Queues, RoutingKeys } from '../../topology';

export type OrderStatus = 'PENDING' | 'CANCELLED' | 'COMPLETED';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly orders = new Map<string, OrderStatus>();

  constructor(
    @Inject(AMQP_PUBLISHER)
    private readonly publisher: AmqpMessagePublisher,
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(Queues.ORDER_STATUS, async (message) => {
      const order: OrderPayload = JSON.parse(message.payload);

      if (!this.orders.has(order.orderId)) {
        console.log(`[ORDER] Unknown order ${order.orderId}`);
        return;
      }

      const status: OrderStatus =
        message.routingKey === RoutingKeys.INVOICE_ISSUED
          ? 'COMPLETED'
          : 'CANCELLED';

      this.orders.set(order.orderId, status);
      console.log(
        `[ORDER] ${order.orderId} -> ${status} (${message.routingKey})`,
      );
    });
  }

  async createOrder(order: OrderPayload): Promise<void> {
    this.orders.set(order.orderId, 'PENDING');

    await this.publisher.publish({
      destination: Exchanges.ORDER,
      routingKey: RoutingKeys.ORDER_CREATED,
      key: order.orderId,
      payload: order,
    });

    console.log(`[ORDER] ${order.orderId} created`);
  }

  getStatus(orderId: string): OrderStatus | undefined {
    return this.orders.get(orderId);
  }
}
