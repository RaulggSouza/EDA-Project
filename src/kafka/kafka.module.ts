import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaPublisher } from './kafka.publisher';
import { KafkaDestinationManager } from
  './kafka-destination-manager';
import { KafkaConsumerAdapter } from './kafka-consumer.adapter';

@Module({
  providers: [
    KafkaService,
    KafkaPublisher,
    KafkaDestinationManager,
    KafkaConsumerAdapter,
  ],
  exports: [
    KafkaService,
    KafkaPublisher,
    KafkaDestinationManager,
    KafkaConsumerAdapter,
  ],
})
export class KafkaModule {}