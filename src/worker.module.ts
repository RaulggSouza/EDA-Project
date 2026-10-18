import { Module } from "@nestjs/common";
import { KafkaModule } from "./kafka/kafka.module";
import { OrdersConsumerService } from "./orders/orders-consumer.service";
import { StockConsumerService } from "./stock/stock-consumer.service";

@Module({
  imports: [KafkaModule],
  providers: [OrdersConsumerService, StockConsumerService],
})
export class WorkerModule {}