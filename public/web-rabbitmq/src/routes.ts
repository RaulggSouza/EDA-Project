export interface RouteInfo {
  path: string;
  code: string;
  key: string;
  label: string;
}

export const ROUTES: RouteInfo[] = [
  { path: '/finish-order', code: 'Digit1', key: 'Alt+1', label: 'Loja' },
  { path: '/services', code: 'Digit2', key: 'Alt+2', label: 'Serviços' },
  { path: '/email', code: 'Digit3', key: 'Alt+3', label: 'E-mail' },
];
