import { OutgoingMessage } from './outgoing-message.interface';

export interface MessagePublisher {
  publish(message: OutgoingMessage): Promise<void>;
}