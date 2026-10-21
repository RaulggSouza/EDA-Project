import { el } from './dom';
import { TRAFFIC_COLORS, createTrafficLight } from './window';

export interface SafariFrame {
  element: HTMLElement;
  content: HTMLElement;
}

export function createSafariFrame(url: string): SafariFrame {
  const element = el(
    'div',
    'flex h-full max-h-[720px] w-full max-w-[1000px] flex-col overflow-hidden rounded-[10px] bg-white shadow-2xl',
  );

  const lights = el('div', 'flex gap-[7px]');
  lights.append(
    createTrafficLight(TRAFFIC_COLORS.close),
    createTrafficLight(TRAFFIC_COLORS.minimize),
    createTrafficLight(TRAFFIC_COLORS.maximize),
  );

  const address = el(
    'div',
    'mx-auto w-1/2 rounded-md bg-white py-0.5 text-center text-xs text-neutral-600 shadow-inner',
    `🔒 ${url}`,
  );

  const toolbar = el(
    'div',
    'flex h-11 shrink-0 items-center border-b border-neutral-300 bg-gradient-to-b from-neutral-100 to-neutral-200 px-3',
  );
  toolbar.append(lights, address);

  const content = el('div', 'min-h-0 flex-1 overflow-auto bg-white');
  element.append(toolbar, content);

  return { element, content };
}
