export interface IncomingMessage {
  destination: string;
  key?: string;
  payload: string;
}

export interface MessageConsumer {
  subscribe(
    destination: string,
    groupId: string,
    handler: (message: IncomingMessage) => Promise<void>,
  ): Promise<void>;
}

export const MESSAGE_CONSUMER = Symbol('MESSAGE_CONSUMER');
