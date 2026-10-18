import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WorkerModule } from './worker.module';

async function bootstrap() {
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