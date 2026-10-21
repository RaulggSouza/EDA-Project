import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../rabbitmq.module';
import { InventoryService } from './inventory.service';

@Module({
  imports: [RabbitmqModule],
  providers: [InventoryService],
})
export class InventoryModule {}
