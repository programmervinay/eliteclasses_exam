import React from 'react';
import { CheckCircle2, Circle, CheckSquare, Square, Cloud, Check } from 'lucide-react';
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

      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
          {question.question_text}
        </h2>
        {question.image_url && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 max-h-72">
            <img 
              src={question.image_url} 
              alt="Question illustration" 
              className="w-full h-auto object-contain bg-slate-50 dark:bg-slate-950" 
            />
          </div>
        )}
      </div>

      {/* Question Options */}
      <div className="space-y-3">
        {question.options && question.options.map((option: QuestionOption, optIdx: number) => {
          const isSelected = selectedOptionIds.includes(option.id);
          const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

          return (
            <div
              key={option.id}
              onClick={() => onSelectOption(option.id)}
              className={`group flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3 shrink-0 pt-0.5">
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

              <div className="flex-1">
                <span className={`text-sm sm:text-base leading-relaxed ${
                  isSelected
                    ? 'font-medium text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {option.option_text}
                </span>
                {option.image_url && (
                  <div className="mt-2 max-w-xs">
                    <img src={option.image_url} alt={`Option ${optionLabel}`} className="rounded-lg border" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
