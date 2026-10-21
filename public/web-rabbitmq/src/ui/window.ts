import { el } from './dom';

export const TRAFFIC_COLORS = {
  close: 'bg-[#ff5f57]',
  minimize: 'bg-[#febc2e]',
  maximize: 'bg-[#28c840]',
};

export interface WindowOptions {
  title: string;
  onClose?: () => void;
  onMaximize?: () => void;
  className?: string;
}

export interface WindowView {
  element: HTMLElement;
  body: HTMLElement;
  setTitle(title: string): void;
  setControlsDisabled(disabled: boolean): void;
}

export function createTrafficLight(
  color: string,
  onClick?: () => void,
): HTMLButtonElement {
  const cursor = onClick ? 'cursor-pointer' : 'cursor-default';
  const light = el(
    'button',
    `h-3 w-3 rounded-full ${color} ${cursor} disabled:opacity-50`,
  );
  light.type = 'button';
  light.tabIndex = -1;
  if (onClick) {
    light.addEventListener('click', onClick);
  }
  return light;
}

export function createWindow({
  title,
  onClose,
  onMaximize,
  className = '',
}: WindowOptions): WindowView {
  const element = el(
    'div',
    `flex flex-col overflow-hidden rounded-[10px] bg-white shadow-2xl ${className}`,
  );
  const close = createTrafficLight(TRAFFIC_COLORS.close, onClose);
  const maximize = createTrafficLight(TRAFFIC_COLORS.maximize, onMaximize);
  const lights = el('div', 'z-10 flex gap-[7px]');
  lights.append(
    close,
    createTrafficLight(TRAFFIC_COLORS.minimize),
    maximize,
  );

  const titleText = el(
    'div',
    'pointer-events-none absolute inset-x-0 text-center text-xs font-semibold text-neutral-600',
    title,
  );
  const bar = el(
    'div',
    'relative flex h-7 shrink-0 items-center border-b border-neutral-400 bg-gradient-to-b from-neutral-200 to-neutral-300 px-2.5',
  );
  bar.append(lights, titleText);

  const body = el('div', 'relative min-h-0 flex-1');
  element.append(bar, body);

  return {
    element,
    body,
    setTitle: (value) => {
      titleText.textContent = value;
    },
    setControlsDisabled: (disabled) => {
      close.disabled = disabled;
      maximize.disabled = disabled;
    },
  };
}
