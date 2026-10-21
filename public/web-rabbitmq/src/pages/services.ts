import type { ActivityEvent } from '../api/services-api';
import type { ServiceName } from '../config';
import type { Page } from '../router';
import { monitors, type ServiceSnapshot } from '../state/service-monitor';
import { el } from '../ui/dom';
import { formatTimestamp } from '../ui/format';
import { createWindow } from '../ui/window';

const PANELS: { service: ServiceName; title: string }[] = [
  { service: 'inventory', title: 'Inventory' },
  { service: 'payment', title: 'Payment' },
  { service: 'invoice', title: 'Invoice' },
  { service: 'dispatch', title: 'Dispatch' },
];

const LINE_COLORS: Record<string, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
};

function eventLine(event: ActivityEvent): HTMLElement {
  const color = LINE_COLORS[event.type] ?? 'text-neutral-400';
  return el(
    'div',
    `break-words ${color}`,
    `[${formatTimestamp(event.at)}] ${event.message}`,
  );
}

function mountTerminal(
  parent: HTMLElement,
  service: ServiceName,
  title: string,
): () => void {
  const monitor = monitors[service];
  const view = createWindow({
    title,
    onClose: () => void monitor.stop(),
    onMaximize: () => void monitor.start(),
    className: 'min-h-0',
  });

  const log = el(
    'div',
    'absolute inset-0 overflow-y-auto bg-black p-3 font-mono text-xs leading-relaxed',
  );
  const veil = el(
    'div',
    'absolute inset-0 hidden items-center justify-center bg-black/75 text-sm font-bold tracking-[3px] text-neutral-300',
    'OFFLINE',
  );
  view.body.append(log, veil);
  parent.append(view.element);

  const render = (snapshot: ServiceSnapshot) => {
    log.replaceChildren(...snapshot.events.map(eventLine));
    log.scrollTop = log.scrollHeight;
    const offline = snapshot.status !== 'up';
    veil.classList.toggle('hidden', !offline);
    veil.classList.toggle('flex', offline);
    view.setControlsDisabled(snapshot.pending);
  };

  render(monitor.snapshot);
  return monitor.subscribe(render);
}

export const servicesPage: Page = {
  render(root) {
    const grid = el('div', 'grid h-screen grid-cols-2 grid-rows-2 gap-3 p-3');
    const unsubscribes = PANELS.map(({ service, title }) =>
      mountTerminal(grid, service, title),
    );
    root.append(grid);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  },
};
