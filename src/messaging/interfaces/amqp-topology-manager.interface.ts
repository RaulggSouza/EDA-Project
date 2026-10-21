import { DestinationManager } from './destination-manager.interface';

export interface AmqpTopologyManager extends DestinationManager {
  declareTopology(): Promise<void>;
}
