
import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { Consumer } from 'kafkajs';
import { MessageConsumer, IncomingMessage } from '../messaging/interfaces/message-consumer.interface';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaConsumerAdapter implements OnModuleDestroy {
  private readonly consumers = new Map<string, Consumer>();

  constructor(private readonly kafkaService: KafkaService) {}

  async subscribe(
    destination: string,
    groupId: string,
    handler: (message: IncomingMessage) => Promise<void>,
  ): Promise<void> {
    if (this.consumers.has(groupId)) {
      throw new Error(`Consumer group "${groupId}" already subscribed`);
    }

    const consumer = this.kafkaService.client.consumer({ groupId });

    this.consumers.set(groupId, consumer);

    try {
      await consumer.connect();

      await consumer.subscribe({
        topic: destination,
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          await handler({
            destination: topic,
            key: message.key?.toString(),
            payload: message.value?.toString() ?? '',
          });
        },
      });
    } catch (error) {
      this.consumers.delete(groupId);
      await consumer.disconnect();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      [...this.consumers.values()].map((consumer) =>
        consumer.disconnect(),
      ),
    );
  }
}
