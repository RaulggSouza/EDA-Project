import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpMessagePublisher } from '../../../messaging/interfaces/amqp-message-publisher.interface';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER, AMQP_PUBLISHER } from '../../rabbitmq.constants';
import { Exchanges, Queues, RoutingKeys } from '../../topology';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly payments = new Set<string>();

  constructor(
    @Inject(AMQP_PUBLISHER)
    private readonly publisher: AmqpMessagePublisher,
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(Queues.PAYMENT_INVENTORY_RESERVED, (message) =>
      this.process(JSON.parse(message.payload)),
    );
    await this.consumer.consume(Queues.PAYMENT_INVOICE_FAILED, (message) =>
      this.refund(JSON.parse(message.payload)),
    );
  }

  private async process(order: OrderPayload): Promise<void> {
    if (order.simulate === 'payment_declined') {
      console.log(`[PAYMENT] ${order.orderId} declined`);
      await this.publisher.publish({
        destination: Exchanges.PAYMENT,
        routingKey: RoutingKeys.PAYMENT_DECLINED,
        key: order.orderId,
        payload: { ...order, reason: 'Payment declined' },
      });
      return;
    }

    this.payments.add(order.orderId);
    console.log(`[PAYMENT] ${order.orderId} approved (${order.amount})`);
    await this.publisher.publish({
      destination: Exchanges.PAYMENT,
      routingKey: RoutingKeys.PAYMENT_APPROVED,
      key: order.orderId,
      payload: order,
    });
  }

  private async refund(order: OrderPayload): Promise<void> {
    if (!this.payments.delete(order.orderId)) {
      console.log(`[PAYMENT] No payment found for ${order.orderId}`);
      return;
    }

    console.log(`[PAYMENT] ${order.orderId} refunded (${order.amount})`);
  }
}
