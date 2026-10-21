import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { MqttModule } from './mqtt.module';

export async function bootstrapMqtt(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(MqttModule);
  app.useStaticAssets(join(__dirname, '..', '..', 'public'));
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
