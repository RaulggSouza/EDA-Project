import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaPublisher } from './kafka.publisher';
import { KafkaDestinationManager } from
  './kafka-destination-manager';
import { KafkaConsumerAdapter } from './kafka-consumer.adapter';
import { KafkaDemoConsumerManager } from './functions/kafka-demo-consumer.manager';

@Module({
  providers: [
    KafkaService,
    KafkaPublisher,
    KafkaDestinationManager,
    KafkaConsumerAdapter,
    KafkaDemoConsumerManager,
  ],
  exports: [
    KafkaService,
    KafkaPublisher,
    KafkaDestinationManager,
    KafkaConsumerAdapter,
    KafkaDemoConsumerManager,
  ],
})
export class KafkaModule {}
