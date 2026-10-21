import {
  fetchEvents,
  fetchStatus,
  startService,
  stopService,
  type ActivityEvent,
  type ServiceStatus,
} from '../api/services-api';
import { SERVICE_NAMES, type ServiceName } from '../config';

const POLL_INTERVAL_MS = 1000;
const MAX_EVENTS = 200;

export interface ServiceSnapshot {
  status: ServiceStatus | 'unreachable';
  events: ActivityEvent[];
  pending: boolean;
}

type Listener = (snapshot: ServiceSnapshot) => void;

export class ServiceMonitor {
  private state: ServiceSnapshot = {
    status: 'unreachable',
    events: [],
    pending: false,
  };
  private readonly listeners = new Set<Listener>();
  private cursor = 0;
  private timer?: number;
  private polling = false;

  constructor(private readonly service: ServiceName) {}

  get snapshot(): ServiceSnapshot {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  startPolling(): void {
    if (this.timer !== undefined) {
      return;
    }
    void this.poll();
    this.timer = window.setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  clear(): void {
    this.update({ events: [] });
  }

  stop(): Promise<void> {
    return this.control(stopService);
  }

  start(): Promise<void> {
    return this.control(startService);
  }

  private async control(
    action: (service: ServiceName) => Promise<ServiceStatus>,
  ): Promise<void> {
    if (this.state.pending) {
      return;
    }
    this.update({ pending: true });
    try {
      this.update({ status: await action(this.service) });
      await this.poll();
    } catch {
      this.update({ status: 'unreachable' });
    } finally {
      this.update({ pending: false });
    }
  }

  private async poll(): Promise<void> {
    if (this.polling) {
      return;
    }
    this.polling = true;
    try {
      const status = await fetchStatus(this.service);
      const events = await fetchEvents(this.service, this.cursor);
      if (events.length === 0 && status === this.state.status) {
        return;
      }
      this.cursor = events.reduce(
        (highest, event) => Math.max(highest, event.id),
        this.cursor,
      );
      this.update({
        status,
        events: [...this.state.events, ...events].slice(-MAX_EVENTS),
      });
    } catch {
      if (this.state.status !== 'unreachable') {
        this.update({ status: 'unreachable' });
      }
    } finally {
      this.polling = false;
    }
  }

  private update(changes: Partial<ServiceSnapshot>): void {
    this.state = { ...this.state, ...changes };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const monitors = Object.fromEntries(
  SERVICE_NAMES.map((name) => [name, new ServiceMonitor(name)]),
) as Record<ServiceName, ServiceMonitor>;

export function startAllMonitors(): void {
  Object.values(monitors).forEach((monitor) => monitor.startPolling());
}
