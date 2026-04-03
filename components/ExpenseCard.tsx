'use client';

import { Expense, CATEGORIES } from '@/lib/types';
import { formatAmount, formatDate } from '@/lib/formatters';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: () => void;
  onClick?: () => void;
}

const paymentIcons: Record<string, string> = {
  cash: '💵',
  card: '💳',
  other: '🔄',
};

export default function ExpenseCard({ expense, onDelete, onClick }: ExpenseCardProps) {
  const category = CATEGORIES.find((c) => c.id === expense.categoryId);

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 cursor-pointer active:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: (category?.color || '#26A69A') + '20' }}
      >
        {category?.emoji || '📌'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {expense.description || category?.name || 'Dépense'}
          </p>
          {expense.photoDataUrl && (
            <span className="text-xs text-gray-400 flex-shrink-0">📷</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{category?.name || 'Autre'}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{paymentIcons[expense.paymentMethod]}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-base font-bold text-gray-800">
          {formatAmount(expense.amount, expense.currency)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Supprimer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
