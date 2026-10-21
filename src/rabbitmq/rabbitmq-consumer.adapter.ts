import { Inject, Injectable } from '@nestjs/common';
import type {
  AmqpIncomingMessage,
  AmqpMessageConsumer,
} from '../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpTopologyManager } from '../messaging/interfaces/amqp-topology-manager.interface';
import { IncomingMessage } from '../messaging/interfaces/message-consumer.interface';
import { RabbitmqConnectionService } from './rabbitmq-connection.service';
import { AMQP_TOPOLOGY } from './rabbitmq.constants';

@Injectable()
export class RabbitmqConsumerAdapter implements AmqpMessageConsumer {
  constructor(
    private readonly connection: RabbitmqConnectionService,
    @Inject(AMQP_TOPOLOGY)
    private readonly topology: AmqpTopologyManager,
  ) {}

  async subscribe(
    destination: string,
    _groupId: string,
    handler: (message: IncomingMessage) => Promise<void>,
  ): Promise<void> {
    await this.consume(destination, handler);
  }

  async consume(
    queue: string,
    handler: (message: AmqpIncomingMessage) => Promise<void>,
  ): Promise<void> {
    await this.topology.declareTopology();

    const { channel } = this.connection;

    await channel.consume(queue, async (message) => {
      if (!message) {
        return;
      }

      try {
        await handler({
          destination: queue,
          routingKey: message.fields.routingKey,
          payload: message.content.toString(),
        });
        channel.ack(message);
      } catch (error) {
        console.error(`Message rejected from ${queue}`, error);
        channel.nack(message, false, false);
      }
    });
  }
}
