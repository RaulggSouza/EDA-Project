import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../rabbitmq.module';
import { PaymentService } from './payment.service';

@Module({
  imports: [RabbitmqModule],
  providers: [PaymentService],
})
export class PaymentModule {}
