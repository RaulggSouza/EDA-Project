
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  MESSAGE_CONSUMER,
  type MessageConsumer,
} from '../messaging/interfaces/message-consumer.interface';
import { KafkaConsumerGroup } from '../kafka/types';

@Injectable()
export class StockConsumerService implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly consumer: MessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.subscribe(
      'orders',
      KafkaConsumerGroup.STOCK,
      async (message) => {
        console.log(
          `[STOCK] Topic: ${message.destination} | ` +
            `Order: ${message.key ?? 'sem chave'} | ` +
            `Event: ${message.payload}`,
        );
      },
    );
  }
}
