import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WorkerModule } from './worker.module';
import { getMessagingDriver } from './messaging/messaging.config';
import { bootstrapRabbitmq } from './rabbitmq/rabbitmq-bootstrap';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

async function bootstrap() {
  if (getMessagingDriver() === 'rabbitmq') {
    await bootstrapRabbitmq();
    return;
  }

  if (process.env.APP_MODE === 'worker') {
    const context = await NestFactory.createApplicationContext(WorkerModule);

    context.enableShutdownHooks();
    return;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-webhook-token'],
  });
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
