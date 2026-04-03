export interface Expense {
  id: string;
  amount: number;
  currency: string;
  categoryId: string;
  description: string;
  date: string; // ISO date string
  photoDataUrl?: string; // base64 image stored in IndexedDB
  receiptText?: string;
  paymentMethod: 'cash' | 'card' | 'other';
  createdAt: string;
}

export interface Budget {
  id: string;
  month: number; // 1-12
  year: number;
  amount: number;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Nourriture', emoji: '🍽️', color: '#FF7043' },
  { id: 'accommodation', name: 'Hébergement', emoji: '🏨', color: '#42A5F5' },
  { id: 'transport', name: 'Transport', emoji: '🚲', color: '#66BB6A' },
  { id: 'equipment', name: 'Équipement', emoji: '🔧', color: '#78909C' },
  { id: 'health', name: 'Santé', emoji: '💊', color: '#EF5350' },
  { id: 'leisure', name: 'Loisirs', emoji: '📸', color: '#AB47BC' },
  { id: 'other', name: 'Autre', emoji: '📌', color: '#26A69A' },
];

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD'];
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CAD: 'CA$',
};
