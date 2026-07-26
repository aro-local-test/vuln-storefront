export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface Comment {
  id: number;
  author: string;
  body: string;
}

export const CATALOG: Product[] = [
  { id: 1, name: 'Trail Runner Shoes', price: 89 },
  { id: 2, name: 'Rain Shell Jacket', price: 149 },
  { id: 3, name: 'Merino Base Layer', price: 62 },
  { id: 4, name: 'Alpine Backpack', price: 210 },
];

export const COMMENTS: Comment[] = [];

export const SITE_SETTINGS: Record<string, unknown> = {
  theme: 'light',
  currency: 'USD',
  pageSize: 20,
};

export const ACCOUNTS: Record<string, { email: string; plan: string }> = {
  'user-1': { email: 'shopper@example.com', plan: 'basic' },
};

export function esc(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function page(title: string, body: string): string {
  return `<html><head><title>${title}</title></head><body>${body}</body></html>`;
}
