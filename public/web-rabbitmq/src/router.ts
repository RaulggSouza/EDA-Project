export interface Page {
  render(root: HTMLElement): () => void;
}

const DEFAULT_ROUTE = '/finish-order';

const SHORTCUTS: Record<string, string> = {
  Digit1: '/finish-order',
  Digit2: '/services',
  Digit3: '/email',
};

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
    const path = event.altKey ? SHORTCUTS[event.code] : undefined;
    if (path) {
      event.preventDefault();
      navigate(path);
    }
  });

  show();
}
