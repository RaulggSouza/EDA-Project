import type { ActivityEvent } from '../../api/services-api';
import { monitors, type ServiceSnapshot } from '../../state/service-monitor';
import { el } from '../../ui/dom';
import { formatTimestamp } from '../../ui/format';
import { createWindow } from '../../ui/window';

interface EntryStyle {
  label: string;
  classes: string;
}

const ENTRY_STYLES: Record<string, EntryStyle> = {
  created: { label: 'CRIADO', classes: 'text-neutral-400' },
  confirmed: { label: 'CONFIRMADO', classes: 'text-green-400' },
  invalid: { label: 'INVÁLIDO', classes: 'text-red-400' },
};

const FALLBACK_STYLE: EntryStyle = {
  label: 'EVENTO',
  classes: 'text-neutral-400',
};

export interface AdminWindow {
  element: HTMLElement;
  dispose: () => void;
}

function createEntry(event: ActivityEvent): HTMLElement {
  const style = ENTRY_STYLES[event.type] ?? FALLBACK_STYLE;
  const line = el('div', 'break-all');
  line.append(
    el('span', 'mr-2 text-neutral-500', formatTimestamp(event.at)),
    el('span', `mr-2 font-semibold ${style.classes}`, style.label),
    el('span', 'text-neutral-200', event.message),
  );
  return line;
}

export function createOrderLogWindow(): AdminWindow {
  const monitor = monitors.log;
  const terminal = el(
    'div',
    'h-full overflow-y-auto bg-[#1e1e1e] p-3 font-mono text-xs leading-relaxed',
  );
  const logWindow = createWindow({
    title: 'pedidos.log',
    className: 'h-full min-h-[420px]',
  });
  logWindow.body.append(terminal);

  const render = (snapshot: ServiceSnapshot) => {
    if (snapshot.status === 'unreachable') {
      terminal.replaceChildren(
        el('div', 'text-red-400', 'Serviço de log indisponível'),
      );
      return;
    }
    if (snapshot.events.length === 0) {
      terminal.replaceChildren(
        el('div', 'text-neutral-500', 'Nenhum pedido registrado'),
      );
      return;
    }
    terminal.replaceChildren(...snapshot.events.map(createEntry));
    terminal.scrollTop = terminal.scrollHeight;
  };

  render(monitor.snapshot);
  return { element: logWindow.element, dispose: monitor.subscribe(render) };
}
