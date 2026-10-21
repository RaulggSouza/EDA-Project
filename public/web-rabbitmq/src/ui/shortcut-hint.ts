import { ROUTES } from '../routes';
import { el } from './dom';

export function createShortcutHint(activePath: string): HTMLElement {
  const hint = el(
    'div',
    'fixed inset-x-0 bottom-2 flex justify-center gap-5 text-xs text-white/80',
  );

  for (const route of ROUTES) {
    const active = route.path === activePath;
    const item = el(
      'span',
      `rounded-full px-3 py-1 ${active ? 'bg-black/40 text-white' : ''}`,
    );
    item.append(
      el('span', 'mr-1.5 font-mono font-semibold', route.key),
      route.label,
    );
    hint.append(item);
  }

  return hint;
}
