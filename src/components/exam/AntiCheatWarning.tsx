import React from 'react';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';

interface AntiCheatWarningProps {
  type: string;
  count: number;
  onDismiss: () => void;
}

export const AntiCheatWarning: React.FC<AntiCheatWarningProps> = ({
  type,
  count,
  onDismiss,
}) => {
  const getMessage = () => {
    switch (type) {
      case 'tab_switch':
        return 'Tab switch or window minimizing detected. Please remain focused on the examination screen.';
      case 'fullscreen_exit':
        return 'Fullscreen mode exited. The examination requires full screen focus.';
      case 'copy_attempt':
        return 'Copying examination text or shortcuts is restricted.';
      case 'context_menu':
        return 'Right-click menu is disabled during the active examination.';
      default:
        return 'A distraction or focus change was recorded.';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-bounce-short">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/90 p-4 shadow-xl backdrop-blur-md text-amber-900 dark:text-amber-100">
        <div className="shrink-0 rounded-xl bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Monitoring Alert (#{count})
            </h4>
            <button
              onClick={onDismiss}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200 leading-snug">
            {getMessage()}
          </p>
          <p className="mt-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
            Recorded for teacher review.
          </p>
        </div>
      </div>
    </div>
  );
};
