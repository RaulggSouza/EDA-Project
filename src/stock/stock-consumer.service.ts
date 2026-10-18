import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer } from 'kafkajs';
import { KafkaConsumerGroup } from '../kafka/types';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class StockConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;

  constructor(private readonly kafkaService: KafkaService) {
    this.consumer = this.kafkaService.client.consumer({
      groupId: KafkaConsumerGroup.STOCK,
    });
  }

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: 'orders',
      fromBeginning: true,
    });

    await this.consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          `[STOCK] Topic: ${topic} | Partition: ${partition} | ` +
            `Order: ${message.key?.toString()} | ` +
            `Event: ${message.value?.toString()}`,
        );

        await this.consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (BigInt(message.offset) + 1n).toString(),
          },
        ]);
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
