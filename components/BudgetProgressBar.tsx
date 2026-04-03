'use client';

import { formatAmount } from '@/lib/formatters';

interface BudgetProgressBarProps {
  spent: number;
  budget: number;
  currency: string;
}

export default function BudgetProgressBar({ spent, budget, currency }: BudgetProgressBarProps) {
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = spent > budget && budget > 0;

  let barColor = 'bg-green-500';
  if (percent >= 80 && percent < 100) barColor = 'bg-orange-400';
  if (percent >= 100) barColor = 'bg-red-500';

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">Budget mensuel</span>
        <span
          className={`text-sm font-semibold ${
            overBudget ? 'text-red-600' : percent >= 80 ? 'text-orange-500' : 'text-green-700'
          }`}
        >
          {percent.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">
          Dépensé : <span className="font-semibold text-gray-700">{formatAmount(spent, currency)}</span>
        </span>
        <span className="text-xs text-gray-500">
          Budget : <span className="font-semibold text-gray-700">{formatAmount(budget, currency)}</span>
        </span>
      </div>
      {overBudget && (
        <p className="mt-1 text-xs text-red-600 font-medium text-center">
          ⚠️ Budget dépassé de {formatAmount(spent - budget, currency)}
        </p>
      )}
    </div>
  );
}
