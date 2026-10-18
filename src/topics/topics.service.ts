import {
  Injectable,
  OnModuleInit,
  Inject,
} from '@nestjs/common';

import { DESTINATION_MANAGER } from
  '../messaging/messaging.constants';

import type { DestinationManager } from
  '../messaging/interfaces/destination-manager.interface';

@Injectable()
export class TopicsService implements OnModuleInit {
  constructor(
    @Inject(DESTINATION_MANAGER)
    private readonly destinationManager: DestinationManager,
  ) {}

  async onModuleInit(): Promise<void> {
    const created =
      await this.destinationManager.createOrdersDestination();

    console.log(
      created
        ? 'Orders destination created'
        : 'Orders destination already exists',
    );
  }
}