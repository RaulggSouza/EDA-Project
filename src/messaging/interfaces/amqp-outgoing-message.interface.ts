import { OutgoingMessage } from './outgoing-message.interface';

export interface AmqpOutgoingMessage<T = unknown> extends OutgoingMessage<T> {
  routingKey: string;
}
