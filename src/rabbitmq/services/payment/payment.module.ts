import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { PaymentService } from './payment.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  providers: [PaymentService],
})
export class PaymentModule {}
