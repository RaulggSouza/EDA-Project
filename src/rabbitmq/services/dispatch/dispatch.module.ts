import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  providers: [DispatchService],
})
export class DispatchModule {}
