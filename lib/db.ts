import { supabase } from './supabase';
import { Expense, Budget } from './types';

// Keep db export for legacy hook usage in home page
export const db = {
  expenses: {
    hook: (_event: string, fn: () => void) => {
      return fn;
    },
  },
};

function toRow(expense: Expense) {
  return {
    id: expense.id,
    amount: expense.amount,
    currency: expense.currency,
    category_id: expense.categoryId,
    description: expense.description,
    date: expense.date,
    photo_data_url: expense.photoDataUrl,
    receipt_text: expense.receiptText,
    payment_method: expense.paymentMethod,
    created_at: expense.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    amount: row.amount as number,
    currency: row.currency as string,
    categoryId: row.category_id as string,
    description: row.description as string,
    date: row.date as string,
    photoDataUrl: row.photo_data_url as string | undefined,
    receiptText: row.receipt_text as string | undefined,
    paymentMethod: row.payment_method as 'cash' | 'card' | 'other',
    createdAt: row.created_at as string,
  };
}

export async function addExpense(expense: Expense) {
  const { error } = await supabase.from('expenses').insert(toRow(expense));
  if (error) throw error;
}

export async function updateExpense(id: string, changes: Partial<Expense>) {
  const row: Record<string, unknown> = {};
  if (changes.amount !== undefined) row.amount = changes.amount;
  if (changes.currency !== undefined) row.currency = changes.currency;
  if (changes.categoryId !== undefined) row.category_id = changes.categoryId;
  if (changes.description !== undefined) row.description = changes.description;
  if (changes.date !== undefined) row.date = changes.date;
  if (changes.photoDataUrl !== undefined) row.photo_data_url = changes.photoDataUrl;
  if (changes.receiptText !== undefined) row.receipt_text = changes.receiptText;
  if (changes.paymentMethod !== undefined) row.payment_method = changes.paymentMethod;
  const { error } = await supabase.from('expenses').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of current month
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return fromRow(data);
}

export async function getBudget(year: number, month: number): Promise<Budget | undefined> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();
  if (error) return undefined;
  return {
    id: data.id,
    month: data.month,
    year: data.year,
    amount: data.amount,
    currency: data.currency,
  };
}

export async function setBudget(budget: Budget) {
  const { error } = await supabase.from('budgets').upsert({
    id: budget.id,
    month: budget.month,
    year: budget.year,
    amount: budget.amount,
    currency: budget.currency,
  }, { onConflict: 'year,month' });
  if (error) throw error;
}

export async function getMonthlyTotals(
  months: number
): Promise<{ year: number; month: number; total: number }[]> {
  const results = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const expenses = await getExpensesByMonth(d.getFullYear(), d.getMonth() + 1);
    results.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      total: expenses.reduce((sum, e) => sum + e.amount, 0),
    });
  }
  return results;
}
