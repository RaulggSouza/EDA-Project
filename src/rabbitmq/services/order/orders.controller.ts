import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { SIMULATED_FAILURES } from '../../events/saga-events';
import type { OrderPayload } from '../../events/saga-events';
import { OrderService } from './order.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() body: OrderPayload & { broken?: boolean }) {
    this.validate(body);

    const { broken, ...order } = body;
    await this.orderService.createOrder(order, broken === true);

    return { status: 'Order created', orderId: order.orderId };
  }

  @Get()
  listOrders() {
    return this.orderService.list();
  }

  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string) {
    const status = this.orderService.getStatus(orderId);

    if (!status) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return { orderId, status };
  }

  private validate(body: OrderPayload): void {
    if (!body?.orderId || typeof body.orderId !== 'string') {
      throw new BadRequestException('orderId is required');
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }
    if (
      body.discounts !== undefined &&
      (!Array.isArray(body.discounts) ||
        body.discounts.some((sku) => typeof sku !== 'string'))
    ) {
      throw new BadRequestException('discounts must be an array of strings');
    }
    if (body.simulate && !SIMULATED_FAILURES.includes(body.simulate)) {
      throw new BadRequestException(
        `simulate must be one of: ${SIMULATED_FAILURES.join(', ')}`,
      );
    }
  }
}
