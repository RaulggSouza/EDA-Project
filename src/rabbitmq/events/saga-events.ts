export type SimulatedFailure =
  | 'out_of_stock'
  | 'payment_declined'
  | 'invoice_failed';

export const SIMULATED_FAILURES: SimulatedFailure[] = [
  'out_of_stock',
  'payment_declined',
  'invoice_failed',
];

export interface OrderItem {
  sku: string;
  quantity: number;
}

export interface OrderPayload {
  orderId: string;
  items: OrderItem[];
  amount: number;
  simulate?: SimulatedFailure;
  reason?: string;
}
