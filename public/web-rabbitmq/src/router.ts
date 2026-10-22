import { ADMIN_ROUTE, ROUTES } from './routes';
import { createShortcutHint } from './ui/shortcut-hint';

export interface Page {
  render(root: HTMLElement): () => void;
}

const DEFAULT_ROUTE = ROUTES[0].path;
const SHORTCUT_ROUTES = [...ROUTES, ADMIN_ROUTE];

let showCurrentRoute = () => {};

export function navigate(path: string, replace = false): void {
  if (path === location.pathname) {
    return;
  }
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  showCurrentRoute();
}

export function startRouter(
  root: HTMLElement,
  pages: Record<string, Page>,
): void {
  let cleanup = () => {};

  showCurrentRoute = () => {
    if (!Object.hasOwn(pages, location.pathname)) {
      history.replaceState(null, '', DEFAULT_ROUTE);
    }
    cleanup();
    cleanup = () => {};
    root.replaceChildren();
    const path = location.pathname;
    const pageCleanup = pages[path].render(root);
    if (location.pathname !== path) {
      pageCleanup();
      return;
    }
    cleanup = pageCleanup;
    if (ROUTES.some(({ path }) => path === location.pathname)) {
      root.append(createShortcutHint(location.pathname));
    }
  };

  window.addEventListener('popstate', showCurrentRoute);
  window.addEventListener('keydown', (event) => {
    const route = event.altKey
      ? SHORTCUT_ROUTES.find(({ code }) => code === event.code)
      : undefined;
    if (route) {
      event.preventDefault();
      navigate(route.path);
    }
  });

  showCurrentRoute();
}
