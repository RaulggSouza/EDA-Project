import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel, connect } from 'amqplib';

@Injectable()
export class RabbitmqConnectionService
  implements OnModuleInit, OnModuleDestroy
{
  private connection: ChannelModel;
  private amqpChannel: Channel;
  private closing = false;

  get channel(): Channel {
    return this.amqpChannel;
  }

  async onModuleInit(): Promise<void> {
    this.connection = await connect(
      process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    );
    this.connection.on('error', (error) => console.error(error));
    this.connection.on('close', () => {
      if (!this.closing) {
        console.error('RabbitMQ connection lost');
        process.exit(1);
      }
    });
    this.amqpChannel = await this.connection.createChannel();
    console.log('RabbitMQ connected');
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;
    await this.amqpChannel?.close();
    await this.connection?.close();
    console.log('RabbitMQ disconnected');
  }
}
