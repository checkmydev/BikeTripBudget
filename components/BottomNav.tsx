'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Accueil', emoji: '🏠' },
  { href: '/expenses/', label: 'Dépenses', emoji: '📋' },
  { href: '/reports/', label: 'Rapports', emoji: '📊' },
  { href: '/budget/', label: 'Budget', emoji: '💰' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive
                  ? 'text-green-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none">{tab.emoji}</span>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? 'text-green-800' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="block w-1 h-1 rounded-full bg-green-700 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
