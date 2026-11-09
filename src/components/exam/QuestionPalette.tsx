import React from 'react';
import { Lock, Check, Eye } from 'lucide-react';
import type { NavigationMode } from '../../types/database';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  visitedIndices: Set<number>;
  answeredIndices: Set<number>;
  navigationMode: NavigationMode;
  onSelectQuestion: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  visitedIndices,
  answeredIndices,
  navigationMode,
  onSelectQuestion,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Question Palette
        </h3>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {answeredIndices.size} / {totalQuestions} Answered
        </span>
      </div>

      {/* Grid of question buttons */}
      <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = answeredIndices.has(idx);
          const isVisited = visitedIndices.has(idx);
          const isLocked = navigationMode === 'next_only' && idx < currentIndex;
          const isFutureLocked = navigationMode === 'next_only' && idx > currentIndex;

          let btnClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200';

          if (isCurrent) {
            btnClass = 'ring-2 ring-brand-500 bg-brand-500 text-white font-bold shadow-md shadow-brand-500/30';
          } else if (isLocked) {
            btnClass = 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed opacity-60';
          } else if (isAnswered) {
            btnClass = 'bg-emerald-500 text-white font-semibold shadow-sm hover:bg-emerald-600';
          } else if (isVisited) {
            btnClass = 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700';
          }

          const canClick = navigationMode === 'both' || idx === currentIndex;

          return (
            <button
              key={idx}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelectQuestion(idx)}
              className={`relative flex h-10 w-full items-center justify-center rounded-xl text-xs font-semibold transition-all ${btnClass}`}
              title={`Question ${idx + 1}${isLocked ? ' (Locked)' : isAnswered ? ' (Answered)' : isVisited ? ' (Visited)' : ' (Not visited)'}`}
            >
              {isLocked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <span>{idx + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-emerald-500" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-amber-200 border border-amber-400" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-brand-500 ring-1 ring-brand-400" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-slate-200 dark:bg-slate-700" />
          <span>Not Visited</span>
        </div>
      </div>
    </div>
  );
};
