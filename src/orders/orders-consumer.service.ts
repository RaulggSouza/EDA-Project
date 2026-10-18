import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer } from "kafkajs";
import { KafkaService } from "../kafka/kafka.service";
import { KafkaConsumerGroup } from "../kafka/types";

@Injectable()
export class OrdersConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly consumer: Consumer;

  constructor(private readonly kafkaService: KafkaService) {
    this.consumer = this.kafkaService.client.consumer({
      groupId: KafkaConsumerGroup.ORDERS,
    });
  }

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({
        topic: 'orders',
        fromBeginning: true,
    });

    console.log('Kafka consumer connected');

    await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                topic,
                partition,
                offset: message.offset,
                key: message.key?.toString(),
                value: message.value?.toString(),
            });
        },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }
}