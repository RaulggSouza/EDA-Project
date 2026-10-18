import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { OrdersService } from './orders/orders-producer';

@Controller()
export class AppController {
  constructor(private readonly orderService: OrdersService) {}

  @Post('/orders')
  async publishOrder(@Body() body: { orderId: string, message: string }) {
    const { orderId, message } = body;

    await this.orderService.publishOrder(orderId, message);

    return { status: 'Order published', orderId };
  }
}
