import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';

const DISMISS_KEY = 'elite_pwa_banner_dismissed_at';
const COOLDOWN_DAYS = 3;

export const InstallAppBanner: React.FC = () => {
  const { isInstalled, openInstallModal } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) {
        setVisible(false);
        return;
      }
    }

    // Small delay so it smoothly slides up after page load
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  if (!visible || isInstalled) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-slate-700/80">
        
        {/* App Icon + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/icons/icon-192x192.png"
            alt="Elite Classes Logo"
            className="h-10 w-10 rounded-xl object-cover shrink-0 shadow-md border border-white/20"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold truncate">Elite Classes App</h4>
            <p className="text-[10px] text-slate-300 truncate">
              Install on phone for 1-tap exams
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={openInstallModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/30 transition-transform active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Dismiss for 3 days"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
