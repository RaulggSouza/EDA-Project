import { Injectable } from '@nestjs/common';
import { Admin } from 'kafkajs';
import { KafkaService } from './kafka.service';
import type { DestinationManager } from
  '../messaging/interfaces/destination-manager.interface';

@Injectable()
export class KafkaDestinationManager
  implements DestinationManager
{
  private readonly admin: Admin;

  constructor(private readonly kafkaService: KafkaService) {
    this.admin = this.kafkaService.client.admin();
  }

  async createOrdersDestination(): Promise<boolean> {
    await this.admin.connect();

    try {
      const topics = await this.admin.listTopics();

      if (topics.includes('orders')) {
        return false;
      }

      return await this.admin.createTopics({
        topics: [
          {
            topic: 'orders',
            numPartitions: 3,
            replicationFactor: 1,
          },
        ],
      });
    } finally {
      await this.admin.disconnect();
    }
  }
}