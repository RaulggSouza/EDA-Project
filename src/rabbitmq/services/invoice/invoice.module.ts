import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  providers: [InvoiceService],
})
export class InvoiceModule {}
