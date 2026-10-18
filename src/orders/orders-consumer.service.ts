
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  MESSAGE_CONSUMER,
  type MessageConsumer,
} from '../messaging/interfaces/message-consumer.interface';
import { KafkaConsumerGroup } from '../kafka/types';

@Injectable()
export class OrdersConsumerService implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_CONSUMER)
    private readonly consumer: MessageConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.subscribe(
      'orders',
      KafkaConsumerGroup.ORDERS,
      async (message) => {
        console.log({
          topic: message.destination,
          key: message.key,
          value: message.payload,
        });
      },
    );

    console.log('Orders consumer started');
  }
}
