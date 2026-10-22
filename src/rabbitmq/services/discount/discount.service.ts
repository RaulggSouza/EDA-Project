import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { AmqpMessageConsumer } from '../../../messaging/interfaces/amqp-message-consumer.interface';
import type { AmqpMessagePublisher } from '../../../messaging/interfaces/amqp-message-publisher.interface';
import { ServiceActivity } from '../../control/service-activity';
import { DiscountAppliedPayload, OrderPayload } from '../../events/saga-events';
import { AMQP_CONSUMER, AMQP_PUBLISHER } from '../../rabbitmq.constants';
import { Exchanges, Queues, RoutingKeys } from '../../topology';
import { CATALOG, CatalogEntry } from './catalog';

const SPENT_THRESHOLD = 500;
const DISCOUNT_PERCENT = 10;

interface ProductState extends CatalogEntry {
  price: number;
  spent: number;
  applied: boolean;
}

export interface Product {
  sku: string;
  name: string;
  icon: string;
  basePrice: number;
  price: number;
  discountApplied: boolean;
}

export interface Suggestion {
  sku: string;
  name: string;
  icon: string;
  spent: number;
  percent: number;
  currentPrice: number;
  discountedPrice: number;
  status: 'AVAILABLE' | 'APPLIED';
}

@Injectable()
export class DiscountService implements OnModuleInit {
  private readonly products = new Map<string, ProductState>(
    CATALOG.map((entry) => [
      entry.sku,
      { ...entry, price: entry.basePrice, spent: 0, applied: false },
    ]),
  );

  constructor(
    @Inject(AMQP_PUBLISHER)
    private readonly publisher: AmqpMessagePublisher,
    @Inject(AMQP_CONSUMER)
    private readonly consumer: AmqpMessageConsumer,
    private readonly activity: ServiceActivity,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.consume(
      Queues.DISCOUNT_INVOICE_ISSUED,
      async (message) => {
        this.registerConfirmedOrder(
          JSON.parse(message.payload) as OrderPayload,
        );
      },
    );
  }

  listProducts(): Product[] {
    return [...this.products.values()].map((product) => ({
      sku: product.sku,
      name: product.name,
      icon: product.icon,
      basePrice: product.basePrice,
      price: product.price,
      discountApplied: product.applied,
    }));
  }

  listSuggestions(): Suggestion[] {
    return [...this.products.values()]
      .filter((product) => product.applied || this.isEligible(product))
      .map((product) => this.toSuggestion(product));
  }

  async apply(sku: string): Promise<Suggestion> {
    const product = this.products.get(sku);
    if (!product) {
      throw new NotFoundException(`Product ${sku} not found`);
    }
    if (product.applied || !this.isEligible(product)) {
      throw new ConflictException(`No discount available for ${sku}`);
    }

    product.price = this.discountedPrice(product);
    product.applied = true;

    const payload: DiscountAppliedPayload = {
      sku,
      name: product.name,
      percent: DISCOUNT_PERCENT,
      price: product.price,
    };
    this.activity.record(
      'discount',
      `${DISCOUNT_PERCENT}% discount applied to ${sku}`,
    );
    await this.publisher.publish({
      destination: Exchanges.DISCOUNT,
      routingKey: RoutingKeys.DISCOUNT_APPLIED,
      key: sku,
      payload,
    });

    return this.toSuggestion(product);
  }

  private registerConfirmedOrder(order: OrderPayload): void {
    for (const item of order.items) {
      const product = this.products.get(item.sku);
      if (product) {
        product.spent += product.basePrice * item.quantity;
      }
    }

    for (const sku of order.discounts ?? []) {
      this.deactivate(sku);
    }
  }

  private deactivate(sku: string): void {
    const product = this.products.get(sku);
    if (!product?.applied) {
      return;
    }

    product.price = product.basePrice;
    product.applied = false;
    product.spent = 0;
    this.activity.record('discount', `Discount for ${sku} deactivated`);
  }

  private isEligible(product: ProductState): boolean {
    return product.spent > SPENT_THRESHOLD;
  }

  private discountedPrice(product: ProductState): number {
    return (product.basePrice * (100 - DISCOUNT_PERCENT)) / 100;
  }

  private toSuggestion(product: ProductState): Suggestion {
    return {
      sku: product.sku,
      name: product.name,
      icon: product.icon,
      spent: product.spent,
      percent: DISCOUNT_PERCENT,
      currentPrice: product.price,
      discountedPrice: this.discountedPrice(product),
      status: product.applied ? 'APPLIED' : 'AVAILABLE',
    };
  }
}
