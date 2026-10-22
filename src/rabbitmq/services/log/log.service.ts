import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import { ServiceActivity } from '../../control/service-activity';
import { OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER } from '../../rabbitmq.constants';
import { Queues } from '../../topology';

const MAX_RAW_PAYLOAD = 120;
const UNKNOWN_ORDER = 'desconhecido';
const ORDER_ID_PATTERN = /"orderId":"([^"]+)"/;

@Injectable()
export class LogService implements OnModuleInit {
  constructor(
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
    private readonly activity: ServiceActivity,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(Queues.LOG_ORDER_CREATED, async (message) => {
      const order = this.parseOrder(message.payload);
      if (order) {
        this.activity.record('created', `Order ${order.orderId} created`, {
          orderId: order.orderId,
        });
      }
    });

    await this.consumer.consume(Queues.LOG_INVOICE_ISSUED, async (message) => {
      const order = JSON.parse(message.payload) as OrderPayload;
      this.activity.record('confirmed', `Order ${order.orderId} confirmed`, {
        orderId: order.orderId,
      });
    });

    await this.consumer.consume(Queues.LOG_ORDER_FAILED, async (message) => {
      const order = JSON.parse(message.payload) as OrderPayload;
      this.activity.record(
        'invalid',
        `Order ${order.orderId} cancelled (${message.routingKey}: ${order.reason ?? 'no reason'})`,
        { orderId: order.orderId },
      );
    });

    await this.consumer.consume(Queues.LOG_DEAD_LETTER, async (message) => {
      const orderId = ORDER_ID_PATTERN.exec(message.payload)?.[1];
      this.activity.record(
        'invalid',
        `Invalid message discarded: ${message.payload.slice(0, MAX_RAW_PAYLOAD)}`,
        { orderId: orderId ?? UNKNOWN_ORDER },
      );
    });
  }

  private parseOrder(payload: string): OrderPayload | null {
    try {
      return JSON.parse(payload) as OrderPayload;
    } catch {
      return null;
    }
  }
}
