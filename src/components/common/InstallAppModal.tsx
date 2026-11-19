import React from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Bell, 
  Share, 
  PlusSquare,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { APP_CONFIG } from '../../lib/supabase';

export const InstallAppModal: React.FC = () => {
  const { 
    isModalOpen, 
    closeInstallModal, 
    promptInstall, 
    isInstallable, 
    isIOS, 
    isInstalled 
  } = usePWAInstall();

  if (!isModalOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden text-center">
        
        {/* Background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-brand-500/20 via-indigo-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeInstallModal}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo Spotlight */}
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          <div className="relative p-1 rounded-3xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-amber-400 shadow-xl shadow-brand-500/25">
            <img
              src="/icons/icon-512x512.png"
              alt="Elite Classes Logo"
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover bg-slate-950 shadow-inner"
            />
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
              <Sparkles className="h-4 w-4 fill-slate-950" />
            </div>
          </div>
        </div>

        {/* Header */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Install Elite Classes App
        </h3>
        <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
          Powered by {APP_CONFIG.creator}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
          Get the official examination portal on your phone home screen for instant access and distraction-free exams.
        </p>

        {/* Benefits Grid */}
        <div className="mt-5 space-y-2.5 text-left">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1-Tap Instant Launch
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Opens directly from your smartphone home screen without typing URLs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Full-Screen Focus Mode
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                No browser address bar or clutter. Clean, proctored environment for tests.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Exam & Daily Bite Alerts
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Receive instant push notifications whenever Sir Vinay publishes new quizzes.
              </p>
            </div>
          </div>
        </div>

        {/* Compatibility Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Android 10, 11, 12, 13, 14, 15, 16 & iOS Compatible</span>
        </div>

        {/* Action Button Area */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {isInstalled ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ✓ App is already installed on this device!
            </div>
          ) : isIOS ? (
            // iOS Safari instructions
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-left space-y-2">
              <p className="text-xs font-bold text-brand-900 dark:text-brand-200">
                How to install on iPhone / iPad:
              </p>
              <div className="flex items-center gap-2 text-xs text-brand-800 dark:text-brand-300">
                <span className="font-bold">1.</span>
                <span>Tap the <Share className="inline h-3.5 w-3.5 mx-1" /> <strong>Share</strong> button in Safari toolbar.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-800 dark:text-brand-300">
                <span className="font-bold">2.</span>
                <span>Scroll down and tap <PlusSquare className="inline h-3.5 w-3.5 mx-1" /> <strong>"Add to Home Screen"</strong>.</span>
              </div>
            </div>
          ) : isInstallable ? (
            // Android Chrome / Edge 1-click install
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 hover:from-brand-700 hover:to-indigo-700 p-3.5 text-sm font-black text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>Install App on Smartphone</span>
            </button>
          ) : (
            // Browser without direct prompt
            <div className="space-y-2 text-xs text-slate-500">
              <p>
                To install on your phone, open your browser menu (⋮ three dots) and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
              </p>
              <button
                type="button"
                onClick={closeInstallModal}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
