export const Exchanges = {
  ORDER: 'order.events',
  INVENTORY: 'inventory.events',
  PAYMENT: 'payment.events',
  INVOICE: 'invoice.events',
  DLX: 'dlx',
} as const;

export const RoutingKeys = {
  ORDER_CREATED: 'order.created',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_OUT_OF_STOCK: 'inventory.out_of_stock',
  PAYMENT_APPROVED: 'payment.approved',
  PAYMENT_DECLINED: 'payment.declined',
  INVOICE_ISSUED: 'invoice.issued',
  INVOICE_FAILED: 'invoice.failed',
  DEAD_LETTER: 'dead-letter',
} as const;

export const Queues = {
  INVENTORY_ORDER_CREATED: 'inventory-service.order-created',
  INVENTORY_PAYMENT_DECLINED: 'inventory-service.payment-declined',
  INVENTORY_INVOICE_FAILED: 'inventory-service.invoice-failed',
  PAYMENT_INVENTORY_RESERVED: 'payment-service.inventory-reserved',
  PAYMENT_INVOICE_FAILED: 'payment-service.invoice-failed',
  INVOICE_PAYMENT_APPROVED: 'invoice-service.payment-approved',
  EMAIL_INVOICE_ISSUED: 'email-service.invoice-issued',
  EMAIL_ORDER_FAILED: 'email-service.order-failed',
  DISPATCH_INVOICE_ISSUED: 'dispatch-service.invoice-issued',
  ORDER_STATUS: 'order-service.order-status',
  DEAD_LETTER: 'dead-letter',
} as const;

export interface QueueBinding {
  exchange: string;
  routingKey: string;
}

export interface QueueDefinition {
  queue: string;
  bindings: QueueBinding[];
}

export const QUEUE_BINDINGS: QueueDefinition[] = [
  {
    queue: Queues.INVENTORY_ORDER_CREATED,
    bindings: [
      { exchange: Exchanges.ORDER, routingKey: RoutingKeys.ORDER_CREATED },
    ],
  },
  {
    queue: Queues.INVENTORY_PAYMENT_DECLINED,
    bindings: [
      { exchange: Exchanges.PAYMENT, routingKey: RoutingKeys.PAYMENT_DECLINED },
    ],
  },
  {
    queue: Queues.INVENTORY_INVOICE_FAILED,
    bindings: [
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_FAILED },
    ],
  },
  {
    queue: Queues.PAYMENT_INVENTORY_RESERVED,
    bindings: [
      {
        exchange: Exchanges.INVENTORY,
        routingKey: RoutingKeys.INVENTORY_RESERVED,
      },
    ],
  },
  {
    queue: Queues.PAYMENT_INVOICE_FAILED,
    bindings: [
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_FAILED },
    ],
  },
  {
    queue: Queues.INVOICE_PAYMENT_APPROVED,
    bindings: [
      { exchange: Exchanges.PAYMENT, routingKey: RoutingKeys.PAYMENT_APPROVED },
    ],
  },
  {
    queue: Queues.EMAIL_INVOICE_ISSUED,
    bindings: [
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_ISSUED },
    ],
  },
  {
    queue: Queues.EMAIL_ORDER_FAILED,
    bindings: [
      {
        exchange: Exchanges.INVENTORY,
        routingKey: RoutingKeys.INVENTORY_OUT_OF_STOCK,
      },
      { exchange: Exchanges.PAYMENT, routingKey: RoutingKeys.PAYMENT_DECLINED },
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_FAILED },
    ],
  },
  {
    queue: Queues.DISPATCH_INVOICE_ISSUED,
    bindings: [
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_ISSUED },
    ],
  },
  {
    queue: Queues.ORDER_STATUS,
    bindings: [
      {
        exchange: Exchanges.INVENTORY,
        routingKey: RoutingKeys.INVENTORY_OUT_OF_STOCK,
      },
      { exchange: Exchanges.PAYMENT, routingKey: RoutingKeys.PAYMENT_DECLINED },
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_FAILED },
      { exchange: Exchanges.INVOICE, routingKey: RoutingKeys.INVOICE_ISSUED },
    ],
  },
];
