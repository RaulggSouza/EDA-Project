import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { LogService } from './log.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  providers: [LogService],
})
export class LogModule {}
