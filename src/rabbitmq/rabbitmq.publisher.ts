import { Inject, Injectable } from '@nestjs/common';
import type { AmqpMessagePublisher } from '../messaging/interfaces/amqp-message-publisher.interface';
import type { AmqpOutgoingMessage } from '../messaging/interfaces/amqp-outgoing-message.interface';
import type { AmqpTopologyManager } from '../messaging/interfaces/amqp-topology-manager.interface';
import { RabbitmqConnectionService } from './rabbitmq-connection.service';
import { AMQP_TOPOLOGY } from './rabbitmq.constants';

@Injectable()
export class RabbitmqPublisher implements AmqpMessagePublisher {
  constructor(
    private readonly connection: RabbitmqConnectionService,
    @Inject(AMQP_TOPOLOGY)
    private readonly topology: AmqpTopologyManager,
  ) {}

  async publish(message: AmqpOutgoingMessage): Promise<void> {
    await this.topology.declareTopology();

    const body =
      typeof message.payload === 'string'
        ? message.payload
        : JSON.stringify(message.payload);

    this.connection.channel.publish(
      message.destination,
      message.routingKey,
      Buffer.from(body),
      { persistent: true, contentType: 'application/json' },
    );
  }
}
