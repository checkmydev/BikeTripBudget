'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, deleteExpense } from '@/lib/db';
import { Expense, CATEGORIES } from '@/lib/types';
import { formatAmount, formatDateLong } from '@/lib/formatters';

const paymentLabels: Record<string, string> = {
  cash: '💵 Espèces',
  card: '💳 Carte bancaire',
  other: '🔄 Autre',
};

function ExpenseDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showReceiptText, setShowReceiptText] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    db.expenses.get(id).then((exp) => {
      setExpense(exp || null);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    await deleteExpense(id);
    router.push('/expenses/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-4xl mb-3">❓</p>
        <p className="text-gray-600">Dépense introuvable</p>
        <button
          onClick={() => router.push('/expenses/')}
          className="mt-4 text-green-700 font-medium"
        >
          ← Retour
        </button>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === expense.categoryId);

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
        <h1 className="text-xl font-bold text-gray-800 flex-1 truncate">
          {expense.description || category?.name || 'Dépense'}
        </h1>
      </div>

      {/* Amount card */}
      <div
        className="rounded-xl p-6 text-white mb-4 text-center"
        style={{ backgroundColor: '#2E7D32' }}
      >
        <p className="text-sm opacity-80 mb-1">{formatDateLong(expense.date)}</p>
        <p className="text-4xl font-bold">{formatAmount(expense.amount, expense.currency)}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-2xl">{category?.emoji}</span>
          <span className="text-sm opacity-90">{category?.name}</span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
        {expense.description && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Description</span>
            <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">
              {expense.description}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Catégorie</span>
          <span className="text-sm font-medium text-gray-800">
            {category?.emoji} {category?.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Date</span>
          <span className="text-sm font-medium text-gray-800">{formatDateLong(expense.date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Paiement</span>
          <span className="text-sm font-medium text-gray-800">
            {paymentLabels[expense.paymentMethod]}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Devise</span>
          <span className="text-sm font-medium text-gray-800">{expense.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Ajouté le</span>
          <span className="text-sm font-medium text-gray-800">
            {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Photo */}
      {expense.photoDataUrl && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">📷 Photo du reçu</h3>
            <button
              onClick={() => setShowPhoto(!showPhoto)}
              className="text-xs text-green-700 font-medium"
            >
              {showPhoto ? 'Réduire' : 'Agrandir'}
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expense.photoDataUrl}
            alt="Reçu"
            onClick={() => setShowPhoto(!showPhoto)}
            className={`w-full rounded-xl cursor-pointer object-cover transition-all ${
              showPhoto ? 'max-h-screen' : 'max-h-32'
            }`}
          />
        </div>
      )}

      {/* OCR Text */}
      {expense.receiptText && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowReceiptText(!showReceiptText)}
          >
            <h3 className="text-sm font-semibold text-gray-700">📄 Texte du reçu</h3>
            <span className="text-gray-400 text-sm">{showReceiptText ? '▲' : '▼'}</span>
          </button>
          {showReceiptText && (
            <pre className="mt-3 text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
              {expense.receiptText}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/add/?id=${id}&from=expense`)}
          className="flex-1 py-3 rounded-xl border-2 border-green-700 text-green-700 font-semibold text-sm transition-all active:scale-95"
        >
          ✏️ Modifier
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm transition-all active:scale-95"
          >
            🗑️ Supprimer
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm transition-all active:scale-95"
          >
            Confirmer ?
          </button>
        )}
      </div>

      {confirmDelete && (
        <button
          onClick={() => setConfirmDelete(false)}
          className="w-full mt-2 py-2 text-sm text-gray-500"
        >
          Annuler
        </button>
      )}
    </div>
  );
}


export default function ExpenseDetailPage() {
  return (
    <Suspense>
      <ExpenseDetailContent />
    </Suspense>
  );
}
