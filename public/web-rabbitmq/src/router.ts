import { ROUTES } from './routes';
import { createShortcutHint } from './ui/shortcut-hint';

export interface Page {
  render(root: HTMLElement): () => void;
}

const DEFAULT_ROUTE = ROUTES[0].path;

export function startRouter(
  root: HTMLElement,
  pages: Record<string, Page>,
): void {
  let cleanup = () => {};

  const show = () => {
    if (!Object.hasOwn(pages, location.pathname)) {
      history.replaceState(null, '', DEFAULT_ROUTE);
    }
    cleanup();
    root.replaceChildren();
    cleanup = pages[location.pathname].render(root);
    root.append(createShortcutHint(location.pathname));
  };

  const navigate = (path: string) => {
    if (path === location.pathname) {
      return;
    }
    history.pushState(null, '', path);
    show();
  };

  window.addEventListener('popstate', show);
  window.addEventListener('keydown', (event) => {
    const route = event.altKey
      ? ROUTES.find(({ code }) => code === event.code)
      : undefined;
    if (route) {
      event.preventDefault();
      navigate(route.path);
    }
  });

  show();
}
