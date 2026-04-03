'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import CategorySelector from '@/components/CategorySelector';
import { db, addExpense, updateExpense, getBudget, getExpensesByMonth } from '@/lib/db';
import { CURRENCIES, Expense } from '@/lib/types';
import { sendBudgetNotification, requestNotificationPermission } from '@/lib/notifications';
function AddExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [categoryId, setCategoryId] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [receiptText, setReceiptText] = useState('');


  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  // Load existing expense for edit
  useEffect(() => {
    if (!editId) return;
    db.expenses.get(editId).then((exp) => {
      if (exp) {
        setAmount(String(exp.amount));
        setCurrency(exp.currency);
        setCategoryId(exp.categoryId);
        setDescription(exp.description);
        setDate(exp.date);
        setPaymentMethod(exp.paymentMethod);
        setPhotoDataUrl(exp.photoDataUrl);
        setReceiptText(exp.receiptText || '');
      }
      setLoadingEdit(false);
    });
  }, [editId]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert('Veuillez saisir un montant valide.');
      return;
    }
    if (!date) {
      alert('Veuillez sélectionner une date.');
      return;
    }

    setSaving(true);
    try {
      const expense: Expense = {
        id: editId || uuidv4(),
        amount: numAmount,
        currency,
        categoryId,
        description: description.trim(),
        date,
        photoDataUrl,
        receiptText: receiptText || undefined,
        paymentMethod,
        createdAt: editId ? (await db.expenses.get(editId))?.createdAt || new Date().toISOString() : new Date().toISOString(),
      };

      if (editId) {
        await updateExpense(editId, expense);
      } else {
        await addExpense(expense);
      }

      // Check budget notification
      const dateObj = new Date(date + 'T12:00:00');
      const [bud, exps] = await Promise.all([
        getBudget(dateObj.getFullYear(), dateObj.getMonth() + 1),
        getExpensesByMonth(dateObj.getFullYear(), dateObj.getMonth() + 1),
      ]);
      if (bud) {
        const total = exps.reduce((s, e) => s + e.amount, 0);
        const pct = (total / bud.amount) * 100;
        if (pct >= 80) {
          await requestNotificationPermission();
          sendBudgetNotification(pct, total, bud.amount, bud.currency);
        }
      }

      router.push('/expenses/');
    } finally {
      setSaving(false);
    }
  }

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white shadow-sm text-gray-600 hover:bg-gray-50"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {editId ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </h1>
      </div>

      {/* Amount */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Montant
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 text-3xl font-bold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-green-600 pb-1 bg-transparent"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-lg font-semibold text-gray-600 bg-gray-100 rounded-lg px-3 py-2 outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
          Catégorie
        </label>
        <CategorySelector selected={categoryId} onChange={setCategoryId} />
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Description
        </label>
        <input
          type="text"
          placeholder="Ex: Déjeuner au restaurant..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-gray-800 outline-none border-b border-gray-200 focus:border-green-600 pb-1 bg-transparent"
        />
      </div>

      {/* Date */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full text-gray-800 outline-none border-b border-gray-200 focus:border-green-600 pb-1 bg-transparent"
        />
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
          Mode de paiement
        </label>
        <div className="flex gap-2">
          {(['cash', 'card', 'other'] as const).map((method) => {
            const labels = { cash: '💵 Espèces', card: '💳 Carte', other: '🔄 Autre' };
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  paymentMethod === method
                    ? 'border-green-700 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                {labels[method]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo + OCR */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
          Reçu / Photo
        </label>

        {photoDataUrl ? (
          <div className="relative mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUrl}
              alt="Reçu"
              className="w-full max-h-40 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => setPhotoDataUrl(undefined)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <span>📷</span>
          {photoDataUrl ? 'Changer la photo' : 'Prendre / choisir une photo'}
        </button>

      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#2E7D32' }}
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>💾 {editId ? 'Mettre à jour' : 'Enregistrer'}</>
        )}
      </button>
    </div>
  );
}

export default function AddExpensePage() {
  return (
    <Suspense>
      <AddExpenseContent />
    </Suspense>
  );
}
