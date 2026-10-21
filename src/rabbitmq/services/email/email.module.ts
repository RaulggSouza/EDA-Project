import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../rabbitmq.module';
import { EmailService } from './email.service';

@Module({
  imports: [RabbitmqModule],
  providers: [EmailService],
})
export class EmailModule {}
