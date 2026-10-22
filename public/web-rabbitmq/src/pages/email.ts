import type { ActivityEvent } from '../api/services-api';
import type { Page } from '../router';
import { monitors, type ServiceSnapshot } from '../state/service-monitor';
import { el } from '../ui/dom';
import { formatTimestamp } from '../ui/format';
import { createSafariFrame } from '../ui/safari-frame';

interface TagStyle {
  label: string;
  classes: string;
}

const TAGS: Record<string, TagStyle> = {
  confirmation: {
    label: 'confirmação',
    classes: 'bg-green-100 text-green-700',
  },
  failure: { label: 'falha', classes: 'bg-orange-100 text-orange-700' },
  invalid: { label: 'inválida', classes: 'bg-red-100 text-red-700' },
  discount: { label: 'desconto', classes: 'bg-blue-100 text-blue-700' },
};

type EmailFilter = 'all' | 'confirmed' | 'invalid';

const FILTERS: { value: EmailFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'confirmed', label: 'Pedidos confirmados' },
  { value: 'invalid', label: 'Pedidos inválidos' },
];

const FILTER_TYPES: Record<EmailFilter, string[] | null> = {
  all: null,
  confirmed: ['confirmation'],
  invalid: ['failure', 'invalid'],
};

function matchesFilter(event: ActivityEvent, filter: EmailFilter): boolean {
  const types = FILTER_TYPES[filter];
  return types === null || types.includes(event.type);
}

const WRAP = '[overflow-wrap:anywhere]';

function createTag(type: string): HTMLElement {
  const style = TAGS[type] ?? {
    label: type,
    classes: 'bg-neutral-200 text-neutral-600',
  };
  return el(
    'span',
    `rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.classes}`,
    style.label,
  );
}

export const emailPage: Page = {
  render(root) {
    const monitor = monitors.email;
    let selectedId: number | null = null;
    let filter: EmailFilter = 'all';

    const filterBar = el('div', 'flex gap-1 border-b border-neutral-200 p-2');
    const list = el('div', 'min-h-0 flex-1 overflow-y-auto');
    const sidebar = el(
      'div',
      'flex w-1/3 flex-col border-r border-neutral-200',
    );
    sidebar.append(filterBar, list);
    const reader = el('div', 'min-w-0 flex-1 overflow-y-auto p-5');

    const frame = createSafariFrame('mail.exemplo.com/inbox');
    frame.content.className = 'flex min-h-0 flex-1 overflow-hidden bg-white';
    frame.content.append(sidebar, reader);
    const wrapper = el('div', 'flex h-full items-center justify-center p-6');
    wrapper.append(frame.element);
    root.append(wrapper);

    const renderItem = (event: ActivityEvent) => {
      const selected = event.id === selectedId;
      const item = el(
        'button',
        `block w-full border-b border-neutral-200 px-3 py-2 text-left ${
          selected ? 'bg-blue-500 text-white' : 'hover:bg-neutral-100'
        }`,
      );
      item.type = 'button';
      item.addEventListener('click', () => {
        selectedId = event.id;
        render(monitor.snapshot);
      });
      item.append(
        el(
          'div',
          `text-sm font-semibold ${WRAP}`,
          event.subject ?? event.message,
        ),
        el(
          'div',
          `text-xs ${selected ? 'text-blue-100' : 'text-neutral-500'}`,
          formatTimestamp(event.at),
        ),
      );
      return item;
    };

    const renderReader = (event: ActivityEvent | undefined) => {
      if (!event) {
        reader.replaceChildren(
          el('p', 'text-sm text-neutral-400', 'Selecione uma mensagem'),
        );
        return;
      }
      const meta = el(
        'div',
        'flex items-center gap-2 text-xs text-neutral-500',
      );
      meta.append(createTag(event.type), formatTimestamp(event.at));
      if (event.orderId) {
        meta.append(`· ${event.orderId}`);
      }
      reader.replaceChildren(
        meta,
        el(
          'h2',
          `my-3 text-lg font-semibold text-neutral-800 ${WRAP}`,
          event.subject ?? event.message,
        ),
        el(
          'p',
          `whitespace-pre-wrap font-mono text-sm text-neutral-600 ${WRAP}`,
          event.message,
        ),
      );
    };

    const renderFilterBar = () => {
      filterBar.replaceChildren(
        ...FILTERS.map(({ value, label }) => {
          const button = el(
            'button',
            `rounded-md px-2 py-1 text-xs font-medium ${
              value === filter
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`,
            label,
          );
          button.type = 'button';
          button.addEventListener('click', () => {
            filter = value;
            render(monitor.snapshot);
          });
          return button;
        }),
      );
    };

    const render = (snapshot: ServiceSnapshot) => {
      renderFilterBar();
      const events = [...snapshot.events]
        .reverse()
        .filter((event) => matchesFilter(event, filter));
      if (!events.some((event) => event.id === selectedId)) {
        selectedId = events[0]?.id ?? null;
      }
      if (events.length === 0) {
        list.replaceChildren(
          el('p', 'p-4 text-sm text-neutral-400', 'Nenhuma mensagem'),
        );
      } else {
        list.replaceChildren(...events.map(renderItem));
      }
      renderReader(events.find((event) => event.id === selectedId));
    };

    render(monitor.snapshot);
    return monitor.subscribe(render);
  },
};
