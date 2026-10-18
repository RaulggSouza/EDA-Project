import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Producer } from 'kafkajs';

import { KafkaService } from './kafka.service';
import { MessagePublisher } from '../messaging/interfaces/message-publisher.interface';
import { OutgoingMessage } from '../messaging/interfaces/outgoing-message.interface';

@Injectable()
export class KafkaPublisher
  implements MessagePublisher, OnModuleInit, OnModuleDestroy
{
  private readonly producer: Producer;

  constructor(private readonly kafkaService: KafkaService) {
    this.producer = this.kafkaService.client.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    console.log('Kafka producer connected');
  }

  async publish(message: OutgoingMessage): Promise<void> {
    await this.producer.send({
      topic: message.destination,
      messages: [
        {
          key: message.key,
          value:
            typeof message.payload === 'string'
              ? message.payload
              : JSON.stringify(message.payload),
        },
      ],
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    console.log('Kafka producer disconnected');
  }
}