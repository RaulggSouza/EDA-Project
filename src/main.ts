import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WorkerModule } from './worker.module';
import { getMessagingDriver } from './messaging/messaging.config';
import { bootstrapRabbitmq } from './rabbitmq/rabbitmq-bootstrap';

async function bootstrap() {
  if (getMessagingDriver() === 'rabbitmq') {
    await bootstrapRabbitmq();
    return;
  }

  if (process.env.APP_MODE === 'worker') {
    const context = await NestFactory.createApplicationContext(
      WorkerModule,
    );

    context.enableShutdownHooks();
    return;
  }

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();