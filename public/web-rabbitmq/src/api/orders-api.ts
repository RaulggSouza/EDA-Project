import axios, { isAxiosError } from 'axios';
import { ORDER_URL } from '../config';

const REQUEST_TIMEOUT_MS = 3000;

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface NewOrder {
  orderId: string;
  items: { sku: string; quantity: number }[];
  amount: number;
  discounts?: string[];
  broken?: boolean;
}

const client = axios.create({
  baseURL: ORDER_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

export async function createOrder(order: NewOrder): Promise<void> {
  await client.post('/orders', order);
}

export async function fetchOrderStatus(
  orderId: string,
): Promise<OrderStatus | null> {
  try {
    const { data } = await client.get<{ status: OrderStatus }>(
      `/orders/${orderId}`,
    );
    return data.status;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
