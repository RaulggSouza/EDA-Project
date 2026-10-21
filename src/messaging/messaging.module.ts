
import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { KafkaPublisher } from '../kafka/kafka.publisher';
import { KafkaConsumerAdapter } from '../kafka/kafka-consumer.adapter';

import { DESTINATION_MANAGER, MESSAGE_PUBLISHER } from './messaging.constants';
import { MESSAGE_CONSUMER } from './interfaces/message-consumer.interface';
import { KafkaDestinationManager } from '../kafka/kafka-destination-manager';

@Module({
  imports: [KafkaModule],
  providers: [
    {
      provide: MESSAGE_PUBLISHER,
      useExisting: KafkaPublisher,
    },
    {
      provide: MESSAGE_CONSUMER,
      useExisting: KafkaConsumerAdapter,
    },
    {
      provide: DESTINATION_MANAGER,
      useExisting: KafkaDestinationManager,
    },
  ],
  exports: [
    MESSAGE_PUBLISHER,
    MESSAGE_CONSUMER,
    DESTINATION_MANAGER,
    KafkaModule,
  ],
})
export class MessagingModule {}
