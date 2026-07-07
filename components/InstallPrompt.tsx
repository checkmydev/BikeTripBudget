'use client';

import { useEffect, useState } from 'react';

// Chrome's beforeinstallprompt event (not in standard TS lib types)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'eve-install-dismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed / running standalone → never show
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (sessionStorage.getItem(DISMISS_KEY)) return;

    // Android / Chromium: capture the native prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS: no beforeinstallprompt — show a manual "Add to Home Screen" hint
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|chrome/.test(ua);
    if (isIos && isSafari) {
      setShowIosHint(true);
      setVisible(true);
    }

    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-md px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#2E7D32] text-xl">
          🚲
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Installer l&apos;application</p>
          {showIosHint ? (
            <p className="text-xs text-gray-500">
              Appuie sur <span aria-hidden>􀈂</span> Partager, puis « Sur l&apos;écran d&apos;accueil ».
            </p>
          ) : (
            <p className="text-xs text-gray-500">Accès rapide et hors ligne depuis ton écran d&apos;accueil.</p>
          )}
        </div>
        {!showIosHint && (
          <button
            onClick={install}
            className="flex-shrink-0 rounded-xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white active:opacity-80"
          >
            Installer
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="flex-shrink-0 rounded-full px-2 py-1 text-gray-400 active:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
