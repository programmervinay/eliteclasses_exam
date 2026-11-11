import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  Cloud,
  Check,
  Maximize2,
  X,
} from 'lucide-react';
import type { Question, QuestionOption } from '../../types/database';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: Question;
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  isSaving?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  question,
  selectedOptionIds,
  onSelectOption,
  isSaving = false,
}) => {
  const isMultiple = question.question_type === 'multiple_choice';
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const hasOptionImages = Boolean(question.options?.some((opt) => Boolean(opt.image_url)));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm">
      
      {/* Header with question number and marks tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-sm">
            {questionNumber}
          </span>
          <span className="text-xs font-medium text-slate-500">
            of {totalQuestions} Questions
          </span>
          {question.question_type === 'multiple_choice' && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Multiple Correct
            </span>
          )}
          {question.question_type === 'true_false' && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              True / False
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Saving Status Indicator */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Cloud className="h-3.5 w-3.5 animate-pulse" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Auto-saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              +{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
            </span>
            {question.negative_marks > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                -{question.negative_marks} Neg
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question Text & Image */}
      <div className="mb-6">
        {question.question_text && (
          <h2 className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
            {question.question_text}
          </h2>
        )}
        {question.image_url && (
          <div className={`${question.question_text ? 'mt-4' : ''} relative group inline-block w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 sm:p-3`}>
            <img
              src={question.image_url}
              alt="Question illustration"
              onClick={() => setZoomedImageUrl(question.image_url)}
              className="mx-auto max-h-72 sm:max-h-80 w-auto max-w-full rounded-xl object-contain cursor-zoom-in"
            />
            <button
              type="button"
              onClick={() => setZoomedImageUrl(question.image_url)}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-slate-900 transition-colors"
              title="Zoom image"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Zoom</span>
            </button>
          </div>
        )}
      </div>

      {/* Question Options */}
      <div className={hasOptionImages ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}>
        {question.options && question.options.map((option: QuestionOption, optIdx: number) => {
          const isSelected = selectedOptionIds.includes(option.id);
          const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

          return (
            <div
              key={option.id}
              onClick={() => onSelectOption(option.id)}
              className={`group flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60'
                }`}>
                  {optionLabel}
                </span>

                {isMultiple ? (
                  isSelected ? (
                    <CheckSquare className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                  )
                ) : (
                  isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                  )
                )}
              </div>

              <div className="flex-1 min-w-0">
                {option.option_text && (
                  <span className={`block text-sm sm:text-base leading-relaxed ${
                    isSelected
                      ? 'font-medium text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {option.option_text}
                  </span>
                )}
                {option.image_url && (
                  <div className={`${option.option_text ? 'mt-2' : ''} relative inline-block max-w-full`}>
                    <img
                      src={option.image_url}
                      alt={`Option ${optionLabel}`}
                      className="max-h-40 w-auto max-w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1 object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedImageUrl(option.image_url);
                      }}
                      className="absolute bottom-2 right-2 rounded-lg bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                      title={`Zoom Option ${optionLabel}`}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-Page Image Zoom Lightbox (safe for proctored full-screen exams) */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="absolute -top-3 -right-3 rounded-full bg-slate-900 text-white p-1.5 shadow-lg hover:bg-slate-700"
              aria-label="Close zoomed image"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={zoomedImageUrl}
              alt="Enlarged diagram"
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};
