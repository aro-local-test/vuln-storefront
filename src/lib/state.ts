import crypto from 'crypto';

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

export interface Account {
  email: string;
  plan: string;
  role: string;
  passwordHash: string;
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

// Passwords come from the environment (for example fly secrets), never from source. When a
// variable is unset we fall back to a random per-process value, so there is no guessable or
// committed credential for an attacker to recover.
function seedPasswordHash(envVar: string): string {
  const password = process.env[envVar] || crypto.randomBytes(24).toString('hex');
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const ACCOUNTS: Record<string, Account> = {
  'user-1': { email: 'shopper@example.com', plan: 'basic', role: 'user', passwordHash: seedPasswordHash('STOREFRONT_USER1_PASSWORD') },
  admin: { email: 'admin@example.com', plan: 'pro', role: 'admin', passwordHash: seedPasswordHash('STOREFRONT_ADMIN_PASSWORD') },
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
