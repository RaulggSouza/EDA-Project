import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Consumer } from 'kafkajs';
import type { IncomingMessage, MessageConsumer } from '../messaging/interfaces/message-consumer.interface';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaConsumerAdapter implements MessageConsumer, OnModuleDestroy {
  private readonly consumers = new Set<Consumer>();

  constructor(private readonly kafkaService: KafkaService) {}

  async subscribe(
    destination: string,
    groupId: string,
    handler: (message: IncomingMessage) => Promise<void>,
  ): Promise<void> {
    const consumer = this.kafkaService.client.consumer({ groupId });
    this.consumers.add(consumer);

    try {
      await consumer.connect();
      await consumer.subscribe({ topic: destination, fromBeginning: true });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await handler({
            destination: topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            payload: message.value?.toString() ?? '',
          });
        },
      });
    } catch (error) {
      this.consumers.delete(consumer);
      await consumer.disconnect().catch(() => undefined);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.consumers].map(async (consumer) => {
      await consumer.stop().catch(() => undefined);
      await consumer.disconnect().catch(() => undefined);
    }));
  }
}
