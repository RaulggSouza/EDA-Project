import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TopicsService } from './topics/topics.service';
import { KafkaModule } from './kafka/kafka.module';
import { OrdersService } from './orders/orders-producer';

@Module({
  imports: [KafkaModule],
  controllers: [AppController],
  providers: [
    AppService,
    TopicsService,
    OrdersService
  ],
})
export class AppModule {}
