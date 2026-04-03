'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExpenseCard from '@/components/ExpenseCard';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import {
  db,
  getExpensesByMonth,
  getBudget,
  deleteExpense,
} from '@/lib/db';
import { Expense, Budget } from '@/lib/types';
import { formatAmount, formatMonthYear, getCurrentMonthYear } from '@/lib/formatters';
import { sendBudgetNotification } from '@/lib/notifications';

export default function HomePage() {
  const router = useRouter();
  const { month, year } = getCurrentMonthYear();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [exps, bud] = await Promise.all([
        getExpensesByMonth(year, month),
        getBudget(year, month),
      ]);
      const sorted = exps.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setExpenses(sorted);
      setBudget(bud || null);
      setLoading(false);

      // Check budget notifications
      if (bud) {
        const total = exps.reduce((s, e) => s + e.amount, 0);
        const pct = (total / bud.amount) * 100;
        if (pct >= 80) {
          sendBudgetNotification(pct, total, bud.amount, bud.currency);
        }
      }
    }
    load();

    // Subscribe to DB changes
    const hook = () => setTimeout(load, 100);
    db.expenses.hook('creating', hook);
    db.expenses.hook('deleting', hook);
    return () => {
      db.expenses.hook('creating').unsubscribe(hook);
      db.expenses.hook('deleting').unsubscribe(hook);
    };
  }, [month, year]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const currency = budget?.currency || expenses[0]?.currency || 'EUR';
  const last5 = expenses.slice(0, 5);

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return;
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-5">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">
          {formatMonthYear(month, year)}
        </p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{formatAmount(total, currency)}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {expenses.length} dépense{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="text-4xl">🚲</span>
        </div>
      </div>

      {/* Budget progress */}
      {budget && (
        <div className="mb-4">
          <BudgetProgressBar spent={total} budget={budget.amount} currency={currency} />
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Dépense moyenne</p>
          <p className="text-lg font-bold text-gray-800">
            {expenses.length > 0
              ? formatAmount(total / expenses.length, currency)
              : formatAmount(0, currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Reste budget</p>
          <p
            className={`text-lg font-bold ${
              budget && total > budget.amount ? 'text-red-600' : 'text-green-700'
            }`}
          >
            {budget
              ? formatAmount(Math.max(0, budget.amount - total), currency)
              : '—'}
          </p>
        </div>
      </div>

      {/* Recent expenses */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Dernières dépenses</h2>
          {expenses.length > 5 && (
            <button
              className="text-sm text-green-700 font-medium"
              onClick={() => router.push('/expenses/')}
            >
              Voir tout →
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : last5.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-3">🚵</p>
            <p className="text-gray-500 font-medium">Aucune dépense ce mois</p>
            <p className="text-sm text-gray-400 mt-1">
              Appuyez sur + pour ajouter votre première dépense
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {last5.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                onDelete={() => handleDelete(exp.id)}
                onClick={() => router.push(`/expenses/${exp.id}/`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/add/')}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-95"
        style={{ backgroundColor: '#2E7D32' }}
        aria-label="Ajouter une dépense"
      >
        +
      </button>
    </div>
  );
}
