import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../rabbitmq.module';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [RabbitmqModule],
  controllers: [OrdersController],
  providers: [OrderService],
})
export class OrderModule {}
