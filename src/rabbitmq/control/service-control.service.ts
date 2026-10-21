import { Inject, Injectable } from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../messaging/interfaces/amqp-message-consumer.interface';
import { AMQP_CONSUMER } from '../rabbitmq.constants';
import { ServiceActivity } from './service-activity';

@Injectable()
export class ServiceControl {
  private running = true;

  constructor(
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
    private readonly activity: ServiceActivity,
  ) {}

  get status(): 'up' | 'down' {
    return this.running ? 'up' : 'down';
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    await this.consumer.pauseAll();
    this.running = false;
    this.activity.record('system', 'Service stopped');
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    await this.consumer.resumeAll();
    this.running = true;
    this.activity.record('system', 'Service started');
  }
}
