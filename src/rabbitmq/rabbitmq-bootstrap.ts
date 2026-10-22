import { NestFactory } from '@nestjs/core';
import { DispatchModule } from './services/dispatch/dispatch.module';
import { EmailModule } from './services/email/email.module';
import { InventoryModule } from './services/inventory/inventory.module';
import { InvoiceModule } from './services/invoice/invoice.module';
import { LogModule } from './services/log/log.module';
import { OrderModule } from './services/order/order.module';
import { PaymentModule } from './services/payment/payment.module';

const SERVICE_MODULES = {
  order: OrderModule,
  inventory: InventoryModule,
  payment: PaymentModule,
  invoice: InvoiceModule,
  email: EmailModule,
  dispatch: DispatchModule,
  log: LogModule,
};

export async function bootstrapRabbitmq(): Promise<void> {
  const service = process.env.SERVICE;
  const module = SERVICE_MODULES[service as keyof typeof SERVICE_MODULES];

  if (!module) {
    throw new Error(
      `Invalid SERVICE "${service}". Use one of: ${Object.keys(SERVICE_MODULES).join(', ')}`,
    );
  }

  const app = await NestFactory.create(module);
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
