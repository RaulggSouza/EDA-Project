import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Admin } from 'kafkajs';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class TopicsService implements OnModuleInit, OnModuleDestroy {
    private admin: Admin;

  constructor(private readonly kafkaService: KafkaService) {
    this.admin = this.kafkaService.client.admin();
  }

  async createOrdersTopic(): Promise<boolean> {
    const topics = await this.admin.listTopics();

    if (topics.includes('orders')) {
      return false;
    }

    return this.admin.createTopics({
      topics: [
        {
          topic: 'orders',
          numPartitions: 3,
          replicationFactor: 1,
        },
      ],
    });
  }

  async onModuleInit() {
    await this.admin.connect();
    console.log('Kafka admin connected');

    const created = await this.createOrdersTopic();
    console.log(
      created ? 'Orders topic created' : 'Orders topic already exists',
    );
  }

  async onModuleDestroy() {
    await this.admin.disconnect();
    console.log('Kafka admin disconnected');
  }
}
