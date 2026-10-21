import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { EmailService } from './email.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  providers: [EmailService],
})
export class EmailModule {}
