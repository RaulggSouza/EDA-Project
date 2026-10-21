import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../rabbitmq.module';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [RabbitmqModule],
  providers: [InvoiceService],
})
export class InvoiceModule {}
