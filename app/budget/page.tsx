'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import { getBudget, setBudget, getExpensesByMonth } from '@/lib/db';
import { Budget, CURRENCIES } from '@/lib/types';
import {
  formatMonthYear,
  getMonthName,
  getCurrentMonthYear,
} from '@/lib/formatters';
import { requestNotificationPermission, sendBudgetNotification } from '@/lib/notifications';

interface MonthData {
  year: number;
  month: number;
  budget: Budget | null;
  spent: number;
}

export default function BudgetPage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formMonth, setFormMonth] = useState(currentMonth);
  const [formYear, setFormYear] = useState(currentYear);
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('EUR');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadData() {
    const data: MonthData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const [bud, exps] = await Promise.all([getBudget(y, m), getExpensesByMonth(y, m)]);
      data.push({
        year: y,
        month: m,
        budget: bud || null,
        spent: exps.reduce((s, e) => s + e.amount, 0),
      });
    }
    setMonthsData(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill form when clicking on a month
  function selectMonth(data: MonthData) {
    setFormMonth(data.month);
    setFormYear(data.year);
    setFormAmount(data.budget ? String(data.budget.amount) : '');
    setFormCurrency(data.budget?.currency || 'EUR');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave() {
    const amt = parseFloat(formAmount.replace(',', '.'));
    if (!formAmount || isNaN(amt) || amt <= 0) {
      alert('Veuillez saisir un montant valide.');
      return;
    }
    setSaving(true);
    try {
      await setBudget({
        id: uuidv4(),
        month: formMonth,
        year: formYear,
        amount: amt,
        currency: formCurrency,
      });

      // Check notification for current month
      if (formMonth === currentMonth && formYear === currentYear) {
        const exps = await getExpensesByMonth(currentYear, currentMonth);
        const total = exps.reduce((s, e) => s + e.amount, 0);
        const pct = (total / amt) * 100;
        if (pct >= 80) {
          await requestNotificationPermission();
          sendBudgetNotification(pct, total, amt, formCurrency);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  const years: number[] = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) years.push(y);

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-5">💰 Budget</h1>

      {/* Budget form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
          Définir un budget
        </h2>

        {/* Month + Year selectors */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Mois</label>
            <select
              value={formMonth}
              onChange={(e) => setFormMonth(Number(e.target.value))}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none border border-gray-200 focus:border-green-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m} className="capitalize">
                  {getMonthName(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-400 mb-1">Année</label>
            <select
              value={formYear}
              onChange={(e) => setFormYear(Number(e.target.value))}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none border border-gray-200 focus:border-green-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount + Currency */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Montant</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="ex : 1500"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none border border-gray-200 focus:border-green-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-400 mb-1">Devise</label>
            <select
              value={formCurrency}
              onChange={(e) => setFormCurrency(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none border border-gray-200 focus:border-green-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: saved ? '#43A047' : '#2E7D32' }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </span>
          ) : saved ? (
            '✅ Budget enregistré !'
          ) : (
            '💾 Enregistrer le budget'
          )}
        </button>
      </div>

      {/* Months overview */}
      <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
        Suivi des 6 derniers mois
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {monthsData
            .slice()
            .reverse()
            .map((data) => {
              const isCurrent =
                data.month === currentMonth && data.year === currentYear;
              return (
                <div
                  key={`${data.year}-${data.month}`}
                  className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all active:scale-[0.99] ${
                    isCurrent ? 'ring-2 ring-green-600' : ''
                  }`}
                  onClick={() => selectMonth(data)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {formatMonthYear(data.month, data.year)}
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Ce mois
                        </span>
                      )}
                    </span>
                    {!data.budget && (
                      <span className="text-xs text-gray-400 italic">Pas de budget</span>
                    )}
                  </div>
                  {data.budget ? (
                    <BudgetProgressBar
                      spent={data.spent}
                      budget={data.budget.amount}
                      currency={data.budget.currency}
                    />
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-2">
                      Appuyez pour définir un budget →
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Notification tip */}
      <div className="mt-4 bg-blue-50 rounded-xl p-4">
        <p className="text-xs text-blue-700">
          💡 Vous recevrez une notification lorsque vous atteignez 80% et 100% de votre budget
          mensuel.
        </p>
        <button
          className="mt-2 text-xs text-blue-600 underline"
          onClick={async () => {
            const granted = await requestNotificationPermission();
            alert(
              granted
                ? '✅ Notifications activées !'
                : '❌ Notifications refusées. Veuillez les autoriser dans les paramètres.'
            );
          }}
        >
          Activer les notifications
        </button>
      </div>
    </div>
  );
}
