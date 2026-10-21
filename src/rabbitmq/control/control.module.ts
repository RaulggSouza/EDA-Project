import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../rabbitmq.module';
import { ServiceActivity } from './service-activity';
import { ServiceControlController } from './service-control.controller';
import { ServiceControl } from './service-control.service';

@Module({
  imports: [RabbitmqModule],
  controllers: [ServiceControlController],
  providers: [ServiceActivity, ServiceControl],
  exports: [ServiceActivity],
})
export class ControlModule {}
