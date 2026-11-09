import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  BookOpen, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ReviewQuestionItem, Exam } from '../../types/database';

export const AttemptReviewPage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const [questions, setQuestions] = useState<ReviewQuestionItem[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewData = async () => {
      if (!attemptId || !examId) return;
      setLoading(true);

      try {
        // Fetch exam info
        const { data: examData } = await supabase
          .from('exams')
          .select('*, subject:subjects(*)')
          .eq('id', examId)
          .single();
        if (examData) setExam(examData as Exam);

        // Call secure review RPC
        const { data: reviewData, error: reviewErr } = await supabase.rpc('get_attempt_review', {
          p_attempt_id: attemptId,
        });

        if (reviewErr) throw reviewErr;
        setQuestions((reviewData || []) as ReviewQuestionItem[]);
      } catch (err: any) {
        console.error('Review fetch error:', err);
        setErrorMsg(err.message || 'Unable to load examination answer review.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [examId, attemptId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading answer key review..." />;
  }

  if (errorMsg || questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Not Available</h2>
        <p className="mt-1 text-xs text-slate-500">{errorMsg || 'Review is disabled or attempt is pending.'}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to={`/exam/${examId}/result/${attemptId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Scorecard</span>
        </Link>
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
          Answer Key & Explanations
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Answer Review: {exam?.title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your chosen options against verified solutions and detailed academic explanations.
        </p>
      </div>

      {/* Question Review List */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const selected = q.selected_option_ids || [];
          const correct = q.correct_option_ids || [];
          const isAnswered = q.is_answered;

          // Check correctness
          const isCorrect = isAnswered && 
            selected.length === correct.length && 
            selected.every((id) => correct.includes(id));

          return (
            <div
              key={q.question_id}
              className={`rounded-3xl border p-6 sm:p-8 shadow-sm transition-all ${
                !isAnswered
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  : isCorrect
                  ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-red-300 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/20'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Question {idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isAnswered ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <HelpCircle className="h-3.5 w-3.5" /> Unanswered
                    </span>
                  ) : isCorrect ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+{q.marks})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                      <XCircle className="h-3.5 w-3.5" /> Incorrect {q.negative_marks > 0 && `(-${q.negative_marks})`}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed mb-4">
                {q.question_text}
              </h3>

              {q.image_url && (
                <div className="mb-4 max-h-60 overflow-hidden rounded-xl border border-slate-200">
                  <img src={q.image_url} alt="Question Diagram" className="object-contain" />
                </div>
              )}

              {/* Options */}
              <div className="space-y-2.5 mb-5">
                {q.options && q.options.map((opt, optIdx) => {
                  const isUserChosen = selected.includes(opt.id);
                  const isRightAnswer = correct.includes(opt.id);
                  const label = String.fromCharCode(65 + optIdx);

                  let optClass = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';
                  
                  if (isRightAnswer) {
                    optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold';
                  } else if (isUserChosen && !isRightAnswer) {
                    optClass = 'border-red-400 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-xs sm:text-sm ${optClass}`}
                    >
                      <span className="font-bold shrink-0">{label}.</span>
                      <span className="flex-1">{opt.text}</span>
                      {isRightAnswer && (
                        <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-xs">
                          <CheckCircle2 className="h-4 w-4" /> Correct Answer
                        </span>
                      )}
                      {isUserChosen && !isRightAnswer && (
                        <span className="shrink-0 text-red-600 dark:text-red-400 font-bold flex items-center gap-1 text-xs">
                          <XCircle className="h-4 w-4" /> Your Selection
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Teacher Explanation */}
              {q.explanation && (
                <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 text-xs text-blue-900 dark:text-blue-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1 text-blue-700 dark:text-blue-300">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span>Teacher's Academic Solution & Explanation:</span>
                  </div>
                  <p className="leading-relaxed pl-5">
                    {q.explanation}
                  </p>
                </div>
              )}

            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
        >
          <span>Return to Dashboard</span>
        </Link>
      </div>

    </div>
  );
};
