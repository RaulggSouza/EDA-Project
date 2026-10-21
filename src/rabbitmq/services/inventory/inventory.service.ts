import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpMessagePublisher } from '../../../messaging/interfaces/amqp-message-publisher.interface';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER, AMQP_PUBLISHER } from '../../rabbitmq.constants';
import { Exchanges, Queues, RoutingKeys } from '../../topology';

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly reservations = new Set<string>();

  constructor(
    @Inject(AMQP_PUBLISHER)
    private readonly publisher: AmqpMessagePublisher,
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(Queues.INVENTORY_ORDER_CREATED, (message) =>
      this.reserve(JSON.parse(message.payload)),
    );
    await this.consumer.consume(Queues.INVENTORY_PAYMENT_DECLINED, (message) =>
      this.release(JSON.parse(message.payload)),
    );
    await this.consumer.consume(Queues.INVENTORY_INVOICE_FAILED, (message) =>
      this.release(JSON.parse(message.payload)),
    );
  }

  private async reserve(order: OrderPayload): Promise<void> {
    if (order.simulate === 'out_of_stock') {
      console.log(`[INVENTORY] ${order.orderId} out of stock`);
      await this.publisher.publish({
        destination: Exchanges.INVENTORY,
        routingKey: RoutingKeys.INVENTORY_OUT_OF_STOCK,
        key: order.orderId,
        payload: { ...order, reason: 'Insufficient stock' },
      });
      return;
    }

    this.reservations.add(order.orderId);
    console.log(`[INVENTORY] ${order.orderId} reserved`);
    await this.publisher.publish({
      destination: Exchanges.INVENTORY,
      routingKey: RoutingKeys.INVENTORY_RESERVED,
      key: order.orderId,
      payload: order,
    });
  }

  private async release(order: OrderPayload): Promise<void> {
    if (!this.reservations.delete(order.orderId)) {
      console.log(`[INVENTORY] No reservation found for ${order.orderId}`);
      return;
    }

    console.log(`[INVENTORY] ${order.orderId} reservation released`);
  }
}
