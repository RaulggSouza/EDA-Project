import {
  BadRequestException, Body, Controller, Delete, Get, MessageEvent,
  NotFoundException, Param, Post, Sse,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { KafkaConsumerAdapter } from './kafka/kafka-consumer.adapter';
import { KafkaConsumerGroup } from './kafka/types/kafka-consumer-group.enum';
import { OrdersService } from './orders/orders-service';

@Controller()
export class AppController {
  constructor(
    private readonly orderService: OrdersService,
    private readonly consumers: KafkaConsumerAdapter,
  ) {}

  @Post('/orders')
  async publishOrder(@Body() body: { orderId: string; message: string }) {
    const { orderId, message } = body;
    if (!orderId?.trim()) throw new BadRequestException('orderId é obrigatório.');
    await this.orderService.publishOrder(orderId, message);
    this.consumers.recordPublished(orderId, message ?? 'Pedido criado.');
    return { status: 'Pedido enviado para o Kafka.', orderId };
  }

  @Post('/demo/consumers')
  async createConsumer(@Body() body: { groupId: string; name?: string }) {
    if (!Object.values(KafkaConsumerGroup).includes(body?.groupId as KafkaConsumerGroup)) {
      throw new BadRequestException('Escolha o grupo orders ou stock.');
    }
    try {
      return await this.consumers.createDemoConsumer(body.groupId as KafkaConsumerGroup, body.name);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Não foi possível criar o consumer.');
    }
  }

  @Delete('/demo/consumers/:id')
  async removeConsumer(@Param('id') id: string) {
    try {
      await this.consumers.removeDemoConsumer(id);
      return { status: 'Consumer encerrado.', id };
    } catch (error) {
      throw new NotFoundException(error instanceof Error ? error.message : 'Consumer não encontrado.');
    }
  }

  @Get('/demo/state')
  getDemoState() {
    return this.consumers.getDemoState();
  }

  @Sse('/demo/events')
  demoEvents(): Observable<MessageEvent> {
    return this.consumers.events().pipe(map((data) => ({ data })));
  }
}
