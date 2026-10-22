import { Injectable } from '@nestjs/common';
import type { AmqpTopologyManager } from '../messaging/interfaces/amqp-topology-manager.interface';
import { RabbitmqConnectionService } from './rabbitmq-connection.service';
import { Exchanges, QUEUE_BINDINGS, Queues, RoutingKeys } from './topology';

@Injectable()
export class RabbitmqTopologyManager implements AmqpTopologyManager {
  private declaration?: Promise<void>;

  constructor(private readonly connection: RabbitmqConnectionService) {}

  declareTopology(): Promise<void> {
    this.declaration ??= this.declare();
    return this.declaration;
  }

  async createOrdersDestination(): Promise<boolean> {
    await this.declareTopology();
    return true;
  }

  private async declare(): Promise<void> {
    const { channel } = this.connection;

    await channel.assertExchange(Exchanges.DLX, 'direct', { durable: true });
    for (const exchange of [
      Exchanges.ORDER,
      Exchanges.INVENTORY,
      Exchanges.PAYMENT,
      Exchanges.INVOICE,
      Exchanges.DISCOUNT,
    ]) {
      await channel.assertExchange(exchange, 'topic', { durable: true });
    }

    await channel.assertQueue(Queues.DEAD_LETTER, { durable: true });
    await channel.bindQueue(
      Queues.DEAD_LETTER,
      Exchanges.DLX,
      RoutingKeys.DEAD_LETTER,
    );

    for (const { queue, bindings } of QUEUE_BINDINGS) {
      await channel.assertQueue(queue, {
        durable: true,
        deadLetterExchange: Exchanges.DLX,
        deadLetterRoutingKey: RoutingKeys.DEAD_LETTER,
      });
      for (const { exchange, routingKey } of bindings) {
        await channel.bindQueue(queue, exchange, routingKey);
      }
    }

    console.log('RabbitMQ topology declared');
  }
}
