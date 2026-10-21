import { IncomingMessage, MessageConsumer } from './message-consumer.interface';

export interface AmqpIncomingMessage extends IncomingMessage {
  routingKey: string;
}

export interface AmqpMessageConsumer extends MessageConsumer {
  consume(
    queue: string,
    handler: (message: AmqpIncomingMessage) => Promise<void>,
  ): Promise<void>;
  pauseAll(): Promise<void>;
  resumeAll(): Promise<void>;
}
