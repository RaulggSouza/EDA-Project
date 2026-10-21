import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { OrdersWebhookController } from './orders-webhook';
import { OrdersWebhookService } from './orders-webhook.service';

@Module({
  imports: [MessagingModule],
  controllers: [OrdersWebhookController],
  providers: [OrdersWebhookService],
})
export class WebhooksModule {}
