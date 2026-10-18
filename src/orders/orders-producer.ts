import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;

  constructor(private readonly kafkaService: KafkaService) {
    this.producer = this.kafkaService.client.producer();
  }

  public async publishOrder(orderId: string, message: string): Promise<void> {
    await this.producer.send({
      topic: 'orders',
      messages: [{ key: orderId, value: message }],
    });
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('Kafka producer disconnected');
  }
}
