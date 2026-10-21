import { AmqpOutgoingMessage } from './amqp-outgoing-message.interface';
import { MessagePublisher } from './message-publisher.interface';

export interface AmqpMessagePublisher extends MessagePublisher {
  publish(message: AmqpOutgoingMessage): Promise<void>;
}
