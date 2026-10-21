import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TopicsService } from './topics/topics.service';
import { OrdersService } from './orders/orders-service';
import { MessagingModule } from './messaging/messaging.module';
import { OrdersConsumerService } from './orders/orders-consumer.service';
import { StockConsumerService } from './stock/stock-consumer.service';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [MessagingModule, WebhooksModule],
  controllers: [AppController],
  providers: [
    TopicsService,
    OrdersService,
    OrdersConsumerService,
    StockConsumerService,
  ],
})
export class AppModule {}
