export interface OutgoingMessage<T = unknown> {
  destination: string;
  payload: T;
  key?: string;
}