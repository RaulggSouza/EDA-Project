import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TopicsService } from './topics/topics.service';
import { OrdersService } from './orders/orders-service';
import { MessagingModule } from './messaging/messaging.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [MessagingModule, WebhooksModule],
  controllers: [AppController],
  providers: [
    TopicsService,
    OrdersService,
  ],
})
export class AppModule {}
