import React from 'react';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  remainingTimeFormatted?: string;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  totalQuestions,
  answeredCount,
  unansweredCount,
  remainingTimeFormatted,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Ready to Submit Examination?
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Please review your attempt summary below. Once submitted, your answers will be locked and evaluated.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 text-center">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Answered
            </span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {answeredCount} <span className="text-sm font-medium text-emerald-600/70">/ {totalQuestions}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-3.5 text-center">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Unanswered
            </span>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {unansweredCount}
            </p>
          </div>
        </div>

        {remainingTimeFormatted && (
          <div className="flex items-center justify-center gap-2 mb-6 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-2 rounded-xl">
            <Clock className="h-4 w-4 text-brand-500" />
            <span>Time Left: {remainingTimeFormatted}</span>
          </div>
        )}

        {unansweredCount > 0 && (
          <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            ⚠️ You have <strong>{unansweredCount}</strong> unanswered questions. Are you sure you want to proceed with submission?
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
          >
            Review Questions
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Evaluating...' : 'Yes, Submit Now'}
          </button>
        </div>

      </div>
    </div>
  );
};
