import axios from 'axios';
import { SERVICE_URLS } from '../config';

const REQUEST_TIMEOUT_MS = 3000;

export interface CatalogProduct {
  sku: string;
  name: string;
  icon: string;
  basePrice: number;
  price: number;
  discountApplied: boolean;
}

const client = axios.create({
  baseURL: SERVICE_URLS.discount,
  timeout: REQUEST_TIMEOUT_MS,
});

export async function fetchProducts(): Promise<CatalogProduct[]> {
  const { data } = await client.get<CatalogProduct[]>('/products');
  return data;
}
