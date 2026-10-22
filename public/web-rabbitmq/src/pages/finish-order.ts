import { fetchProducts, type CatalogProduct } from '../api/discount-api';
import type { OrderStatus } from '../api/orders-api';
import type { Page } from '../router';
import { orderTracker, type TrackedOrder } from '../state/order-tracker';
import { el } from '../ui/dom';
import { formatCurrency } from '../ui/format';
import { createSafariFrame } from '../ui/safari-frame';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'text-neutral-500',
  COMPLETED: 'text-green-600',
  CANCELLED: 'text-red-600',
};

function generateOrderId(): string {
  return `ORD-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function stepButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = el(
    'button',
    'h-7 w-7 rounded border border-neutral-300 bg-neutral-100 disabled:opacity-40',
    label,
  );
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

export const finishOrderPage: Page = {
  render(root) {
    let products: CatalogProduct[] = [];
    let refreshers: (() => void)[] = [];
    const quantities = new Map<string, number>();
    let sending = false;
    let disposed = false;

    const list = el(
      'div',
      'text-sm text-neutral-500',
      'Carregando produtos...',
    );
    const total = el('span', 'text-lg font-bold');
    const submit = el(
      'button',
      'rounded-md bg-blue-500 px-4 py-2 font-semibold text-white disabled:opacity-40',
      'Finalizar pedido',
    );
    const broken = el('input');
    broken.type = 'checkbox';
    const feedback = el('p', 'mt-2 text-sm text-red-600');
    const status = el('p', 'mt-4 text-sm text-neutral-500');

    const quantityOf = (sku: string) => quantities.get(sku) ?? 0;
    const totalAmount = () =>
      products.reduce(
        (sum, product) => sum + product.price * quantityOf(product.sku),
        0,
      );

    const renderPrice = (product: CatalogProduct) => {
      const price = el('div', 'text-sm text-neutral-500');
      if (product.discountApplied) {
        price.append(
          el('span', 'mr-2 line-through', formatCurrency(product.basePrice)),
          el(
            'span',
            'font-semibold text-green-600',
            formatCurrency(product.price),
          ),
        );
      } else {
        price.textContent = formatCurrency(product.price);
      }
      return price;
    };

    const renderRow = (product: CatalogProduct) => {
      const quantity = el('span', 'w-6 text-center tabular-nums');
      const change = (delta: number) => {
        quantities.set(
          product.sku,
          Math.max(0, quantityOf(product.sku) + delta),
        );
        refresh();
      };
      const minus = stepButton('−', () => change(-1));
      const plus = stepButton('+', () => change(1));

      const info = el('div');
      info.append(
        el('div', 'font-medium', `${product.icon} ${product.name}`),
        renderPrice(product),
      );
      const controls = el('div', 'flex items-center gap-2');
      controls.append(minus, quantity, plus);
      const row = el(
        'div',
        'flex items-center justify-between border-b border-neutral-200 py-3',
      );
      row.append(info, controls);
      list.append(row);

      return () => {
        quantity.textContent = String(quantityOf(product.sku));
        minus.disabled = quantityOf(product.sku) === 0;
      };
    };

    const refresh = () => {
      refreshers.forEach((update) => update());
      const amount = totalAmount();
      total.textContent = formatCurrency(amount);
      submit.disabled = amount === 0 || sending;
    };

    const loadCatalog = async () => {
      try {
        products = await fetchProducts();
      } catch {
        if (!disposed) {
          list.textContent = 'Catálogo indisponível';
          list.className = 'text-sm text-red-600';
        }
        return;
      }
      if (disposed) {
        return;
      }
      list.replaceChildren();
      list.className = '';
      products.forEach((product) => quantities.set(product.sku, 1));
      refreshers = products.map(renderRow);
      refresh();
    };

    submit.addEventListener('click', async () => {
      const chosen = products.filter((product) => quantityOf(product.sku) > 0);
      sending = true;
      feedback.textContent = '';
      refresh();
      try {
        await orderTracker.submit({
          orderId: generateOrderId(),
          items: chosen.map((product) => ({
            sku: product.sku,
            quantity: quantityOf(product.sku),
          })),
          amount: totalAmount(),
          discounts: chosen
            .filter((product) => product.discountApplied)
            .map((product) => product.sku),
          broken: broken.checked,
        });
      } catch {
        feedback.textContent = 'Falha ao enviar pedido';
      } finally {
        sending = false;
        refresh();
      }
    });

    const showOrder = (order: TrackedOrder | null) => {
      if (!order || order.broken) {
        status.replaceChildren();
        return;
      }
      status.replaceChildren(
        `Pedido #${order.orderId} · `,
        el(
          'span',
          `font-semibold ${STATUS_COLORS[order.status]}`,
          order.status,
        ),
      );
    };

    const totalRow = el('div', 'flex items-center justify-between py-3');
    totalRow.append(el('span', 'font-semibold', 'Total'), total);
    const checkout = el('div', 'flex items-center justify-between py-2');
    const brokenLabel = el('label', 'flex items-center gap-2 text-sm');
    brokenLabel.append(broken, 'Quebrar pedido');
    checkout.append(brokenLabel, submit);

    const store = el(
      'div',
      'mx-auto flex max-w-xl flex-col p-8 text-neutral-800',
    );
    store.append(
      el('h1', 'mb-2 text-2xl font-bold', 'Seu carrinho'),
      list,
      totalRow,
      checkout,
      feedback,
      status,
    );

    const frame = createSafariFrame('loja.exemplo.com/checkout');
    frame.content.append(store);
    const wrapper = el('div', 'flex h-full items-center justify-center p-6');
    wrapper.append(frame.element);
    root.append(wrapper);

    refresh();
    void loadCatalog();
    showOrder(orderTracker.current);
    const unsubscribe = orderTracker.subscribe(showOrder);
    return () => {
      disposed = true;
      unsubscribe();
    };
  },
};
