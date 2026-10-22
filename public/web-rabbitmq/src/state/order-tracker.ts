import {
  createOrder,
  fetchOrderStatus,
  type NewOrder,
  type OrderStatus,
} from '../api/orders-api';

const POLL_INTERVAL_MS = 1000;
const GIVE_UP_AFTER_MS = 30000;

export interface TrackedOrder {
  orderId: string;
  status: OrderStatus;
  broken: boolean;
}

type Listener = (order: TrackedOrder | null) => void;

export class OrderTracker {
  private order: TrackedOrder | null = null;
  private readonly listeners = new Set<Listener>();
  private timer?: number;

  get current(): TrackedOrder | null {
    return this.order;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async submit(order: NewOrder): Promise<void> {
    await createOrder(order);
    this.watch(order.orderId, order.broken === true);
  }

  private watch(orderId: string, broken: boolean): void {
    window.clearTimeout(this.timer);
    this.update({ orderId, status: 'PENDING', broken });
    if (broken) {
      return;
    }
    const deadline = Date.now() + GIVE_UP_AFTER_MS;

    const poll = async () => {
      const status =
        (await fetchOrderStatus(orderId).catch(() => null)) ?? 'PENDING';
      if (this.order?.orderId !== orderId) {
        return;
      }
      this.update({ orderId, status, broken });
      if (status === 'PENDING' && Date.now() < deadline) {
        this.timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    this.timer = window.setTimeout(poll, POLL_INTERVAL_MS);
  }

  private update(order: TrackedOrder): void {
    this.order = order;
    this.listeners.forEach((listener) => listener(order));
  }
}

export const orderTracker = new OrderTracker();
