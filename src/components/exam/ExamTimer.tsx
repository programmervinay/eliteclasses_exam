import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { TimerMode } from '../../types/database';

interface ExamTimerProps {
  timerMode: TimerMode;
  totalDurationSeconds: number; // for whole exam
  questionTimeLimitSeconds?: number; // for per-question mode
  currentQuestionIndex: number;
  onTimeExpired: () => void;
  onQuestionTimeExpired?: () => void;
  startedAt?: string;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  timerMode,
  totalDurationSeconds,
  questionTimeLimitSeconds = 60,
  currentQuestionIndex,
  onTimeExpired,
  onQuestionTimeExpired,
  startedAt,
}) => {
  // If timer mode is 'none', render simple indicator
  if (timerMode === 'none') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
        <Clock className="h-4 w-4 text-slate-400" />
        <span>No Time Limit</span>
      </div>
    );
  }

  // Calculate remaining seconds for whole exam based on server startedAt
  const calculateExamRemaining = () => {
    if (!startedAt) return totalDurationSeconds;
    const startTime = new Date(startedAt).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const left = totalDurationSeconds - elapsedSeconds;
    return left > 0 ? left : 0;
  };

  const [examRemaining, setExamRemaining] = useState(calculateExamRemaining);
  const [questionRemaining, setQuestionRemaining] = useState(questionTimeLimitSeconds);

  // Per-question timer reset on question change
  useEffect(() => {
    if (timerMode === 'question') {
      setQuestionRemaining(questionTimeLimitSeconds);
    }
  }, [currentQuestionIndex, questionTimeLimitSeconds, timerMode]);

  // Main tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (timerMode === 'exam') {
        const remaining = calculateExamRemaining();
        setExamRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          onTimeExpired();
        }
      } else if (timerMode === 'question') {
        setQuestionRemaining((prev) => {
          if (prev <= 1) {
            if (onQuestionTimeExpired) {
              onQuestionTimeExpired();
            }
            return questionTimeLimitSeconds;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMode, startedAt, totalDurationSeconds, questionTimeLimitSeconds, onTimeExpired, onQuestionTimeExpired]);

  const activeRemaining = timerMode === 'exam' ? examRemaining : questionRemaining;
  const isUrgent = timerMode === 'exam' ? activeRemaining < 120 : activeRemaining < 15;

  const minutes = Math.floor(activeRemaining / 60);
  const seconds = activeRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercentage = timerMode === 'exam'
    ? (activeRemaining / totalDurationSeconds) * 100
    : (activeRemaining / questionTimeLimitSeconds) * 100;

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border shrink-0 transition-all ${
      isUrgent
        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 animate-pulse'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
    }`}>
      {isUrgent ? (
        <AlertTriangle className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-red-500 shrink-0" />
      ) : (
        <Clock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-brand-600 dark:text-brand-400 shrink-0" />
      )}
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-tight">
            {formattedTime}
          </span>
          <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {timerMode === 'question' ? 'Q-Timer' : 'Remaining'}
          </span>
        </div>
        
        {/* Micro progress bar (Desktop only to conserve mobile header space) */}
        <div className="hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isUrgent ? 'bg-red-500' : 'bg-brand-600'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
