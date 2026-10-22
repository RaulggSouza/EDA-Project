export interface CatalogEntry {
  sku: string;
  name: string;
  icon: string;
  basePrice: number;
}

export const CATALOG: CatalogEntry[] = [
  {
    sku: 'bluetooth-headphones',
    name: 'Fone Bluetooth',
    icon: '🎧',
    basePrice: 199,
  },
  {
    sku: 'mechanical-keyboard',
    name: 'Teclado Mecânico',
    icon: '⌨️',
    basePrice: 350,
  },
  { sku: 'gaming-mouse', name: 'Mouse Gamer', icon: '🖱️', basePrice: 120 },
];
