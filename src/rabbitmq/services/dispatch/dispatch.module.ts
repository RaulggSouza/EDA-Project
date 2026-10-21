import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../rabbitmq.module';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [RabbitmqModule],
  providers: [DispatchService],
})
export class DispatchModule {}
