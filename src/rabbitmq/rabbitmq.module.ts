import { Module } from '@nestjs/common';
import { RabbitmqConnectionService } from './rabbitmq-connection.service';
import { RabbitmqConsumerAdapter } from './rabbitmq-consumer.adapter';
import { RabbitmqPublisher } from './rabbitmq.publisher';
import { RabbitmqTopologyManager } from './rabbitmq-topology.manager';
import {
  AMQP_CONSUMER,
  AMQP_PUBLISHER,
  AMQP_TOPOLOGY,
} from './rabbitmq.constants';

@Module({
  providers: [
    RabbitmqConnectionService,
    RabbitmqTopologyManager,
    RabbitmqPublisher,
    RabbitmqConsumerAdapter,
    { provide: AMQP_PUBLISHER, useExisting: RabbitmqPublisher },
    { provide: AMQP_CONSUMER, useExisting: RabbitmqConsumerAdapter },
    { provide: AMQP_TOPOLOGY, useExisting: RabbitmqTopologyManager },
  ],
  exports: [AMQP_PUBLISHER, AMQP_CONSUMER, AMQP_TOPOLOGY],
})
export class RabbitmqModule {}
