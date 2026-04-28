'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getSavingsMonthly,
  getSavingsSettings,
  getSavingsVoyage,
  upsertSavingsMonthly,
  upsertSavingsSettings,
  upsertSavingsVoyage,
} from '@/lib/db';
import {
  ML_SORTIES,
  PV_SORTIES,
  SavingsItem,
  VOYAGE_ITEMS,
} from '@/lib/types';
import { getCurrentMonthYear, getMonthName } from '@/lib/formatters';

type Tab = 'provisions' | 'voyage';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function parseAmt(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SavingsRow({
  item,
  value,
  onChange,
}: {
  item: SavingsItem;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800 truncate block">{item.label}</span>
        {item.note && (
          <span className="text-[10px] text-amber-500 italic">{item.note}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={String(item.defaultAmount)}
          className="w-24 text-right bg-gray-50 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none border border-gray-200 focus:border-green-500"
        />
        <span className="text-xs text-gray-400">€</span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  color,
  badge,
  items,
  amounts,
  onAmountChange,
  total,
}: {
  title: string;
  color: string;
  badge: string;
  items: SavingsItem[];
  amounts: Record<string, string>;
  onAmountChange: (key: string, v: string) => void;
  total: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: color + '22', color }}
          >
            {badge}
          </span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{fmt(total)}</span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {items.map((item) => (
            <SavingsRow
              key={item.key}
              item={item}
              value={amounts[item.key] ?? ''}
              onChange={(v) => onAmountChange(item.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function EpargnePage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [tab, setTab] = useState<Tab>('provisions');

  // Month navigation (provisions tab only)
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  // Monthly provision amounts: key → string
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  // Voyage amounts + received state
  const [voyageAmounts, setVoyageAmounts] = useState<Record<string, string>>({});
  const [voyageReceived, setVoyageReceived] = useState<Record<string, boolean>>({});

  // Settings
  const [tripMonths, setTripMonths] = useState('10');
  const [currentSavings, setCurrentSavings] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingProv, setSavingProv] = useState(false);
  const [savedProv, setSavedProv] = useState(false);
  const [savingVoy, setSavingVoy] = useState(false);
  const [savedVoy, setSavedVoy] = useState(false);

  const allItems = [...PV_SORTIES, ...ML_SORTIES];

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [monthly, voyage, settings] = await Promise.all([
      getSavingsMonthly(year, month),
      getSavingsVoyage(),
      getSavingsSettings(),
    ]);

    // Provision amounts: use DB value if exists, else default from config
    const a: Record<string, string> = {};
    for (const item of allItems) {
      a[item.key] =
        monthly[item.key] !== undefined
          ? String(monthly[item.key])
          : String(item.defaultAmount);
    }
    setAmounts(a);

    // Voyage
    const va: Record<string, string> = {};
    const vr: Record<string, boolean> = {};
    for (const item of VOYAGE_ITEMS) {
      va[item.key] =
        voyage[item.key] !== undefined
          ? String(voyage[item.key].amount)
          : String(item.defaultAmount);
      vr[item.key] = voyage[item.key]?.received ?? false;
    }
    setVoyageAmounts(va);
    setVoyageReceived(vr);

    setTripMonths(String(settings.tripMonths));
    setCurrentSavings(String(settings.currentSavings));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Totals ───────────────────────────────────────────────────────────────

  function sumItems(items: SavingsItem[]) {
    return items.reduce((s, i) => s + parseAmt(amounts[i.key] ?? ''), 0);
  }

  const pvTotal = sumItems(PV_SORTIES);
  const mlTotal = sumItems(ML_SORTIES);
  const grandTotal = pvTotal + mlTotal;

  const voyageTotal = VOYAGE_ITEMS.reduce((s, i) => s + parseAmt(voyageAmounts[i.key] ?? ''), 0);
  const voyageReceived_total = VOYAGE_ITEMS.filter((i) => voyageReceived[i.key]).reduce(
    (s, i) => s + parseAmt(voyageAmounts[i.key] ?? ''),
    0
  );
  const tripMonthsNum = parseInt(tripMonths) || 0;
  const currentSavingsNum = parseAmt(currentSavings);
  const monthlyVoyage = tripMonthsNum > 0 ? voyageTotal / tripMonthsNum : 0;
  const projection = currentSavingsNum + voyageReceived_total;
  const progressPct = voyageTotal > 0 ? Math.min(100, (projection / voyageTotal) * 100) : 0;

  // ── Month navigation ─────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === currentMonth && year === currentYear) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = month === currentMonth && year === currentYear;

  // ── Save handlers ────────────────────────────────────────────────────────

  async function saveProvisions() {
    setSavingProv(true);
    try {
      const items = allItems.map((item) => ({
        key: item.key,
        amount: parseAmt(amounts[item.key] ?? ''),
      }));
      await upsertSavingsMonthly(items, year, month);
      setSavedProv(true);
      setTimeout(() => setSavedProv(false), 2000);
    } finally {
      setSavingProv(false);
    }
  }

  async function saveVoyage() {
    setSavingVoy(true);
    try {
      const voyItems = VOYAGE_ITEMS.map((item) => ({
        key: item.key,
        amount: parseAmt(voyageAmounts[item.key] ?? ''),
        received: voyageReceived[item.key] ?? false,
      }));
      await Promise.all([
        upsertSavingsVoyage(voyItems),
        upsertSavingsSettings(tripMonthsNum, currentSavingsNum),
      ]);
      setSavedVoy(true);
      setTimeout(() => setSavedVoy(false), 2000);
    } finally {
      setSavingVoy(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-28 space-y-4">
        <div className="h-8 bg-gray-200 rounded-xl w-40 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">🏦 Épargne</h1>
      <p className="text-xs text-gray-400 mb-5">Prévision & provisions mensuelles</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {(
          [
            { id: 'provisions', label: '📋 Provisions' },
            { id: 'voyage', label: '🚲 Épargne voyage' },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow text-green-800' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Provisions ─────────────────────────────────────────────── */}
      {tab === 'provisions' && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5 bg-white rounded-xl shadow-sm px-4 py-3">
            <button
              onClick={prevMonth}
              className="text-green-700 text-lg font-bold px-2 active:scale-95 transition"
            >
              ‹
            </button>
            <div className="text-center">
              <span className="text-sm font-semibold text-gray-800 capitalize">
                {getMonthName(month)} {year}
              </span>
              {isCurrentMonth && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Ce mois
                </span>
              )}
            </div>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="text-green-700 text-lg font-bold px-2 active:scale-95 transition disabled:opacity-30"
            >
              ›
            </button>
          </div>

          {/* Summary banner */}
          <div className="bg-green-800 text-white rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
            <span className="text-sm">Total provisions / mois</span>
            <span className="text-xl font-bold">{fmt(grandTotal)}</span>
          </div>

          {/* PV section */}
          <SectionCard
            title="Sorties Privé"
            color="#2E7D32"
            badge="PV"
            items={PV_SORTIES}
            amounts={amounts}
            onAmountChange={(k, v) => setAmounts((a) => ({ ...a, [k]: v }))}
            total={pvTotal}
          />

          {/* ML section */}
          <SectionCard
            title="Sorties MoveLab"
            color="#1565C0"
            badge="ML"
            items={ML_SORTIES}
            amounts={amounts}
            onAmountChange={(k, v) => setAmounts((a) => ({ ...a, [k]: v }))}
            total={mlTotal}
          />

          {/* Totals card */}
          <div className="bg-white rounded-xl shadow-sm px-4 py-4 mb-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total PV</span>
              <span className="font-medium text-gray-800">{fmt(pvTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total ML</span>
              <span className="font-medium text-gray-800">{fmt(mlTotal)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
              <span className="text-gray-700">Grand total</span>
              <span className="text-green-800">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={saveProvisions}
            disabled={savingProv}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: savedProv ? '#43A047' : '#2E7D32' }}
          >
            {savingProv ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </span>
            ) : savedProv ? (
              '✅ Provisions enregistrées !'
            ) : (
              '💾 Enregistrer les provisions'
            )}
          </button>
        </>
      )}

      {/* ── TAB: Épargne Voyage ──────────────────────────────────────────── */}
      {tab === 'voyage' && (
        <>
          {/* Settings */}
          <div className="bg-white rounded-xl shadow-sm px-4 py-4 mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Paramètres voyage
            </h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Durée du voyage (mois)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={tripMonths}
                  onChange={(e) => setTripMonths(e.target.value)}
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800 border border-gray-200 outline-none focus:border-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Épargne déjà réservée (€)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800 border border-gray-200 outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-800 text-white rounded-xl px-4 py-4 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm opacity-80">Objectif total</span>
              <span className="text-lg font-bold">{fmt(voyageTotal)}</span>
            </div>
            {tripMonthsNum > 0 && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm opacity-80">Équivalent / mois</span>
                <span className="text-base font-semibold">{fmt(monthlyVoyage)}</span>
              </div>
            )}
            {/* Progress bar */}
            <div className="bg-green-900 rounded-full h-2.5 mb-1">
              <div
                className="bg-white rounded-full h-2.5 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs opacity-70">
              <span>Reçu : {fmt(voyageReceived_total)}</span>
              <span>{Math.round(progressPct)} %</span>
            </div>
          </div>

          {/* Voyage items */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Sources de financement
              </span>
            </div>
            {VOYAGE_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0"
              >
                {/* Received checkbox */}
                <button
                  onClick={() =>
                    setVoyageReceived((r) => ({ ...r, [item.key]: !r[item.key] }))
                  }
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    voyageReceived[item.key]
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {voyageReceived[item.key] && <span className="text-[10px]">✓</span>}
                </button>

                <span
                  className={`flex-1 text-sm truncate ${
                    voyageReceived[item.key] ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {item.label}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={voyageAmounts[item.key] ?? ''}
                    onChange={(e) =>
                      setVoyageAmounts((a) => ({ ...a, [item.key]: e.target.value }))
                    }
                    placeholder={String(item.defaultAmount)}
                    className="w-24 text-right bg-gray-50 rounded-lg px-2 py-1 text-sm text-gray-800 border border-gray-200 outline-none focus:border-green-500"
                  />
                  <span className="text-xs text-gray-400">€</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm px-4 py-4 mb-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total prévu</span>
              <span className="font-medium text-gray-800">{fmt(voyageTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Déjà reçu / coché</span>
              <span className="font-medium text-green-700">{fmt(voyageReceived_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Épargne réservée</span>
              <span className="font-medium text-blue-700">{fmt(currentSavingsNum)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
              <span className="text-gray-700">Reste à obtenir</span>
              <span className={voyageTotal - projection > 0 ? 'text-red-600' : 'text-green-700'}>
                {fmt(Math.max(0, voyageTotal - projection))}
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={saveVoyage}
            disabled={savingVoy}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: savedVoy ? '#43A047' : '#2E7D32' }}
          >
            {savingVoy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </span>
            ) : savedVoy ? (
              '✅ Épargne voyage enregistrée !'
            ) : (
              '💾 Enregistrer l\'épargne voyage'
            )}
          </button>
        </>
      )}
    </div>
  );
}
