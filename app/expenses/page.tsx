'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExpenseCard from '@/components/ExpenseCard';
import { getExpensesByMonth, deleteExpense } from '@/lib/db';
import { Expense, CATEGORIES } from '@/lib/types';
import { formatAmount, formatDayHeader, formatMonthYear } from '@/lib/formatters';

export default function ExpensesPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const exps = await getExpensesByMonth(year, month);
    const sorted = exps.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setExpenses(sorted);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const nowDate = new Date();
    const isCurrentMonth = year === nowDate.getFullYear() && month === nowDate.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return;
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = expenses.filter((e) => {
    const matchCat = categoryFilter === 'all' || e.categoryId === categoryFilter;
    const matchSearch =
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      CATEGORIES.find((c) => c.id === e.categoryId)
        ?.name.toLowerCase()
        .includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by date
  const groups: Record<string, Expense[]> = {};
  for (const exp of filtered) {
    if (!groups[exp.date]) groups[exp.date] = [];
    groups[exp.date].push(exp);
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const currency = expenses[0]?.currency || 'EUR';

  const nowDate = new Date();
  const isCurrentMonth = year === nowDate.getFullYear() && month === nowDate.getMonth() + 1;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl bg-white shadow-sm text-gray-600 hover:bg-gray-50 text-lg"
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-gray-800 capitalize">
            {formatMonthYear(month, year)}
          </h1>
          <p className="text-xs text-gray-500">
            {filtered.length} dépense{filtered.length !== 1 ? 's' : ''} · {formatAmount(total, currency)}
          </p>
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl bg-white shadow-sm text-gray-600 hover:bg-gray-50 text-lg disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm text-sm outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            categoryFilter === 'all'
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Toutes
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              categoryFilter === cat.id
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Expenses grouped by day */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
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
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="text-gray-500 font-medium">Aucune dépense trouvée</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || categoryFilter !== 'all'
              ? 'Modifiez vos filtres'
              : 'Ajoutez une dépense avec le bouton +'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">
                {formatDayHeader(dateStr)}
              </h2>
              <div className="space-y-2">
                {groups[dateStr].map((exp) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    onDelete={() => handleDelete(exp.id)}
                    onClick={() => router.push(`/expenses/${exp.id}/`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
