import {
  applySuggestion,
  fetchSuggestions,
  type Suggestion,
} from '../../api/discount-api';
import { el } from '../../ui/dom';
import { formatCurrency } from '../../ui/format';
import { createWindow } from '../../ui/window';
import type { AdminWindow } from './order-log-window';

const POLL_INTERVAL_MS = 1000;

export function createDiscountWindow(): AdminWindow {
  const content = el(
    'div',
    'flex h-full flex-col items-center justify-center gap-3 overflow-y-auto bg-[#1e1e1e] p-4 text-sm text-neutral-200',
  );
  const discountWindow = createWindow({
    title: 'descontos',
    className: 'h-full min-h-[420px]',
  });
  discountWindow.body.append(content);

  let disposed = false;
  let applying = false;

  const refresh = async () => {
    if (applying) {
      return;
    }
    try {
      const suggestions = await fetchSuggestions();
      if (!disposed) {
        render(suggestions);
      }
    } catch {
      if (!disposed) {
        content.replaceChildren(
          el('p', 'text-red-400', 'Serviço de descontos indisponível'),
        );
      }
    }
  };

  const apply = async (sku: string) => {
    applying = true;
    try {
      await applySuggestion(sku);
    } catch {
      applying = false;
      return refresh();
    }
    applying = false;
    return refresh();
  };

  const createCard = (suggestion: Suggestion): HTMLElement => {
    const applied = suggestion.status === 'APPLIED';
    const button = el(
      'button',
      'rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white disabled:bg-neutral-600 disabled:text-neutral-400',
      applied ? 'Desconto aplicado' : 'Aplicar desconto',
    );
    button.type = 'button';
    button.disabled = applied;
    button.addEventListener('click', () => void apply(suggestion.sku));

    const card = el(
      'div',
      'flex w-64 flex-col gap-2 rounded-lg border border-neutral-600 p-3 text-center',
    );
    card.append(
      el('div', 'font-semibold', `${suggestion.icon} ${suggestion.name}`),
      el(
        'div',
        'text-xs text-neutral-400',
        `Total gasto: ${formatCurrency(suggestion.spent)}`,
      ),
      el(
        'div',
        'text-xs',
        `Sugestão: ${suggestion.percent}% de desconto (${formatCurrency(suggestion.discountedPrice)})`,
      ),
      button,
    );
    if (applied) {
      card.append(
        el(
          'p',
          'text-xs text-green-400',
          'Desconto aplicado. Será desativado após o próximo pedido confirmado que o usar.',
        ),
      );
    }
    return card;
  };

  const render = (suggestions: Suggestion[]) => {
    if (suggestions.length === 0) {
      content.replaceChildren(
        el('p', 'text-neutral-500', 'Nenhuma sugestão de desconto no momento'),
      );
      return;
    }
    content.replaceChildren(...suggestions.map(createCard));
  };

  void refresh();
  const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);

  return {
    element: discountWindow.element,
    dispose: () => {
      disposed = true;
      window.clearInterval(timer);
    },
  };
}
