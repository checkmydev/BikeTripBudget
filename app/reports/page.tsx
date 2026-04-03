'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { getExpensesByMonth, getBudget } from '@/lib/db';
import { Expense, CATEGORIES, Budget } from '@/lib/types';
import {
  formatAmount,
  formatMonthYear,
  getMonthShort,
  getCurrentMonthYear,
} from '@/lib/formatters';

interface CategoryTotal {
  id: string;
  name: string;
  emoji: string;
  color: string;
  total: number;
  percent: number;
}

interface MonthBar {
  label: string;
  total: number;
  budget: number | null;
}

export default function ReportsPage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthBars, setMonthBars] = useState<MonthBar[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPieData(y: number, m: number) {
    const [exps, bud] = await Promise.all([getExpensesByMonth(y, m), getBudget(y, m)]);
    setExpenses(exps);
    setBudget(bud || null);

    const grandTotal = exps.reduce((s, e) => s + e.amount, 0);
    const cats: CategoryTotal[] = CATEGORIES.map((cat) => {
      const catExps = exps.filter((e) => e.categoryId === cat.id);
      const total = catExps.reduce((s, e) => s + e.amount, 0);
      return {
        ...cat,
        total,
        percent: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      };
    }).filter((c) => c.total > 0);
    setCategoryTotals(cats.sort((a, b) => b.total - a.total));
  }

  async function loadBarData() {
    const bars: MonthBar[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const [exps, bud] = await Promise.all([getExpensesByMonth(y, m), getBudget(y, m)]);
      bars.push({
        label: getMonthShort(m),
        total: exps.reduce((s, e) => s + e.amount, 0),
        budget: bud ? bud.amount : null,
      });
    }
    setMonthBars(bars);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPieData(year, month), loadBarData()]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (year === currentYear && month === currentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const currency = budget?.currency || expenses[0]?.currency || 'EUR';
  const isCurrentMonth = year === currentYear && month === currentMonth;

  // Custom tooltip for pie
  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg rounded-xl p-3 text-sm border border-gray-100">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-gray-600">{formatAmount(payload[0].value, currency)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar
  const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg rounded-xl p-3 text-sm border border-gray-100">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className={p.name === 'total' ? 'text-green-700' : 'text-blue-500'}>
              {p.name === 'total' ? 'Dépenses' : 'Budget'} : {formatAmount(p.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Determine budget reference line (use most recent non-null budget)
  const budgetRef = monthBars.find((b) => b.budget !== null)?.budget ?? null;

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-5">📊 Rapports</h1>

      {/* Month selector */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl bg-white shadow-sm text-gray-600 text-lg"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800 capitalize">
            {formatMonthYear(month, year)}
          </p>
          <p className="text-xs text-gray-500">{formatAmount(grandTotal, currency)}</p>
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl bg-white shadow-sm text-gray-600 text-lg disabled:opacity-30"
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Pie chart */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
              Répartition par catégorie
            </h2>
            {categoryTotals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">Aucune dépense ce mois</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="name"
                    >
                      {categoryTotals.map((cat) => (
                        <Cell key={cat.id} fill={cat.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category table */}
                <div className="mt-4 space-y-2">
                  {categoryTotals.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-gray-600 flex-1">
                        {cat.emoji} {cat.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {formatAmount(cat.total, currency)}
                      </span>
                      <span className="text-xs text-gray-400 w-10 text-right">
                        {cat.percent.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bar chart - last 6 months */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
              6 derniers mois
            </h2>
            {monthBars.every((b) => b.total === 0) ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">📈</p>
                <p className="text-sm">Pas encore de données</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthBars} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="total" name="total" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  {budgetRef !== null && (
                    <ReferenceLine
                      y={budgetRef}
                      stroke="#EF5350"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: 'Budget',
                        position: 'insideTopRight',
                        fontSize: 10,
                        fill: '#EF5350',
                      }}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary stats */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                Résumé
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Total dépenses</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">
                    {formatAmount(grandTotal, currency)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Nb. dépenses</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">{expenses.length}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Moyenne / dépense</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">
                    {formatAmount(grandTotal / expenses.length, currency)}
                  </p>
                </div>
                {budget && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Budget utilisé</p>
                    <p
                      className={`text-base font-bold mt-0.5 ${
                        grandTotal > budget.amount ? 'text-red-600' : 'text-green-700'
                      }`}
                    >
                      {((grandTotal / budget.amount) * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
