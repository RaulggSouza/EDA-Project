import { Injectable } from '@nestjs/common';

const MAX_EVENTS = 100;

export interface ActivityEvent {
  id: number;
  at: string;
  type: string;
  message: string;
  orderId?: string;
  subject?: string;
}

interface ActivityDetails {
  orderId?: string;
  subject?: string;
}

@Injectable()
export class ServiceActivity {
  private readonly events: ActivityEvent[] = [];
  private nextId = 1;

  record(type: string, message: string, details: ActivityDetails = {}): void {
    this.events.push({
      id: this.nextId++,
      at: new Date().toISOString(),
      type,
      message,
      ...details,
    });

    if (this.events.length > MAX_EVENTS) {
      this.events.shift();
    }

    console.log(`[${process.env.SERVICE?.toUpperCase()}] ${message}`);
  }

  list(after = 0): ActivityEvent[] {
    return this.events.filter((event) => event.id > after);
  }
}
