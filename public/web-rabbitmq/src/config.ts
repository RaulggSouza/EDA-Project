export type ServiceName =
  'inventory' | 'payment' | 'invoice' | 'email' | 'dispatch' | 'discount';

const env = import.meta.env;

export const ORDER_URL: string = env.VITE_ORDER_URL ?? 'http://localhost:3000';

export const ADMIN_PASSWORD: string = env.VITE_ADMIN_PASSWORD ?? 'admin';

export const SERVICE_URLS: Record<ServiceName, string> = {
  inventory: env.VITE_INVENTORY_URL ?? 'http://localhost:3001',
  payment: env.VITE_PAYMENT_URL ?? 'http://localhost:3002',
  invoice: env.VITE_INVOICE_URL ?? 'http://localhost:3003',
  email: env.VITE_EMAIL_URL ?? 'http://localhost:3004',
  dispatch: env.VITE_DISPATCH_URL ?? 'http://localhost:3005',
  discount: env.VITE_DISCOUNT_URL ?? 'http://localhost:3006',
};

export const SERVICE_NAMES = Object.keys(SERVICE_URLS) as ServiceName[];
