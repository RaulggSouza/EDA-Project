export interface DestinationManager {
  createOrdersDestination(): Promise<boolean>;
}