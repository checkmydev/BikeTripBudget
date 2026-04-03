'use client';

import { CATEGORIES } from '@/lib/types';

interface CategorySelectorProps {
  selected: string;
  onChange: (id: string) => void;
}

export default function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all ${
            selected === cat.id
              ? 'border-green-700 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <span className="text-xl">{cat.emoji}</span>
          <span
            className={`text-[10px] font-medium whitespace-nowrap ${
              selected === cat.id ? 'text-green-800' : 'text-gray-500'
            }`}
          >
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}
