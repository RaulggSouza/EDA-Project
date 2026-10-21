import { Module } from '@nestjs/common';
import { ControlModule } from '../../control/control.module';
import { RabbitmqModule } from '../../rabbitmq.module';
import { InventoryService } from './inventory.service';

@Module({
  imports: [RabbitmqModule, ControlModule],
  providers: [InventoryService],
})
export class InventoryModule {}
