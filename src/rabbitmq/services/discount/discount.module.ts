import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  controllers: [DiscountController],
  providers: [DiscountService],
})
export class DiscountModule {}
