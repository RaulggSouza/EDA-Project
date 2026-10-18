import { Module } from "@nestjs/common";
import { OrdersConsumerService } from "./orders/orders-consumer.service";
import { StockConsumerService } from "./stock/stock-consumer.service";
import { MessagingModule } from "./messaging/messaging.module";

@Module({
  imports: [MessagingModule],
  providers: [OrdersConsumerService, StockConsumerService],
})
export class WorkerModule {}