import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpMessagePublisher } from '../../../messaging/interfaces/amqp-message-publisher.interface';
import { ServiceActivity } from '../../control/service-activity';
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
    private readonly activity: ServiceActivity,
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
      this.activity.record('error', `${order.orderId} declined`, {
        orderId: order.orderId,
      });
      await this.publisher.publish({
        destination: Exchanges.PAYMENT,
        routingKey: RoutingKeys.PAYMENT_DECLINED,
        key: order.orderId,
        payload: { ...order, reason: 'Payment declined' },
      });
      return;
    }

    this.payments.add(order.orderId);
    this.activity.record(
      'success',
      `${order.orderId} approved (${order.amount})`,
      { orderId: order.orderId },
    );
    await this.publisher.publish({
      destination: Exchanges.PAYMENT,
      routingKey: RoutingKeys.PAYMENT_APPROVED,
      key: order.orderId,
      payload: order,
    });
  }

  private async refund(order: OrderPayload): Promise<void> {
    if (!this.payments.delete(order.orderId)) {
      this.activity.record('info', `No payment found for ${order.orderId}`, {
        orderId: order.orderId,
      });
      return;
    }

    this.activity.record(
      'info',
      `${order.orderId} refunded (${order.amount})`,
      { orderId: order.orderId },
    );
  }
}
