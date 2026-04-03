import Dexie, { Table } from 'dexie';
import { Expense, Budget } from './types';

export class EveDatabase extends Dexie {
  expenses!: Table<Expense>;
  budgets!: Table<Budget>;

  constructor() {
    super('EveDatabase');
    this.version(1).stores({
      expenses: 'id, date, categoryId, amount',
      budgets: 'id, [year+month]',
    });
  }
}

export const db = new EveDatabase();

export async function addExpense(expense: Expense) {
  return db.expenses.add(expense);
}

export async function updateExpense(id: string, changes: Partial<Expense>) {
  return db.expenses.update(id, changes);
}

export async function deleteExpense(id: string) {
  return db.expenses.delete(id);
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-31`;
  return db.expenses.where('date').between(start, end, true, true).toArray();
}

export async function getBudget(year: number, month: number): Promise<Budget | undefined> {
  return db.budgets.where('[year+month]').equals([year, month]).first();
}

export async function setBudget(budget: Budget) {
  const existing = await getBudget(budget.year, budget.month);
  if (existing) {
    return db.budgets.update(existing.id, budget);
  }
  return db.budgets.add(budget);
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
