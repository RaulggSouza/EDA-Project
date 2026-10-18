import { Inject, Injectable } from '@nestjs/common';
import { MESSAGE_PUBLISHER } from '../messaging/messaging.constants';
import type { MessagePublisher } from '../messaging/interfaces/message-publisher.interface';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
  ) {}

  public async publishOrder(
    orderId: string,
    message: string,
  ): Promise<void> {
    await this.publisher.publish({
      destination: 'orders',
      key: orderId,
      payload: message,
    });
  }
}