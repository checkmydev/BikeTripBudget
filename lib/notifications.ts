export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendBudgetNotification(
  percent: number,
  spent: number,
  budget: number,
  currency: string
) {
  if (Notification.permission !== 'granted') return;
  const symbol = currency === 'EUR' ? '€' : currency;
  if (percent >= 100) {
    new Notification('⚠️ Budget dépassé !', {
      body: `Vous avez dépensé ${spent.toFixed(2)}${symbol} sur un budget de ${budget.toFixed(2)}${symbol}`,
      icon: '/icon-192.png',
    });
  } else if (percent >= 80) {
    new Notification('⚡ Budget bientôt atteint', {
      body: `${percent.toFixed(0)}% du budget utilisé (${spent.toFixed(2)}${symbol} / ${budget.toFixed(2)}${symbol})`,
      icon: '/icon-192.png',
    });
  }
}
