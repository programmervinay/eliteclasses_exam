import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Maximize2, 
  CloudCheck,
  Send,
  Cloud
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Watermark } from '../../components/common/Watermark';
import { ExamTimer } from '../../components/exam/ExamTimer';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { SubmitModal } from '../../components/exam/SubmitModal';
import { AntiCheatWarning } from '../../components/exam/AntiCheatWarning';
import type { Exam, Question, Attempt, SuspiciousEventType } from '../../types/database';

export const ExamSessionPage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student answer state: map questionId -> string[] (selected option ids)
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]));
  const [isSaving, setIsSaving] = useState(false);

  // Anti-cheat & monitoring state
  const [warning, setWarning] = useState<{ type: string; count: number } | null>(null);
  const violationCounts = useRef<Record<string, number>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load of Exam, Attempt, Questions, and Existing Answers
  useEffect(() => {
    const initializeExamSession = async () => {
      if (!examId || !attemptId || !user) return;
      setLoading(true);

      try {
        // Fetch exam
        const { data: examData, error: examErr } = await supabase
          .from('exams')
          .select('*, subject:subjects(*)')
          .eq('id', examId)
          .single();
        if (examErr) throw examErr;
        setExam(examData as Exam);

        // Fetch attempt
        const { data: attemptData, error: attemptErr } = await supabase
          .from('attempts')
          .select('*')
          .eq('id', attemptId)
          .single();
        if (attemptErr) throw attemptErr;

        // If already submitted, redirect to result
        if (attemptData.status === 'submitted') {
          navigate(`/exam/${examId}/result/${attemptId}`, { replace: true });
          return;
        }
        setAttempt(attemptData as Attempt);

        // Fetch questions and options
        const { data: questionsData, error: qErr } = await supabase
          .from('questions')
          .select('*, options:question_options(*)')
          .eq('exam_id', examId)
          .order('display_order', { ascending: true });
        if (qErr) throw qErr;

        // Sort options
        const formattedQuestions = (questionsData as Question[]).map((q) => ({
          ...q,
          options: (q.options || []).sort((a, b) => a.display_order - b.display_order),
        }));
        setQuestions(formattedQuestions);

        // Fetch previously saved answers for this attempt (session recovery)
        const { data: savedAnswers } = await supabase
          .from('attempt_answers')
          .select('*')
          .eq('attempt_id', attemptId);

        if (savedAnswers && savedAnswers.length > 0) {
          const ansMap: Record<string, string[]> = {};
          const visited = new Set<number>([0]);

          savedAnswers.forEach((ans) => {
            ansMap[ans.question_id] = ans.selected_option_ids || [];
            const qIdx = formattedQuestions.findIndex((q) => q.id === ans.question_id);
            if (qIdx !== -1) visited.add(qIdx);
          });

          setAnswers(ansMap);
          setVisitedIndices(visited);
        }

        // Request Fullscreen
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (e) {
          // Fullscreen request may require user gesture on some browsers
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeExamSession();
  }, [examId, attemptId, user, navigate]);

  // 2. Anti-Cheating Event Logger
  const logSuspiciousEvent = async (eventType: SuspiciousEventType, metadata: Record<string, any> = {}) => {
    if (!user || !examId || !attemptId) return;

    // Increment local violation counter
    violationCounts.current[eventType] = (violationCounts.current[eventType] || 0) + 1;
    const currentCount = violationCounts.current[eventType];

    // Show warning toast to student
    setWarning({ type: eventType, count: currentCount });

    // Store in Supabase
    try {
      await supabase.from('suspicious_events').insert([
        {
          student_id: user.id,
          exam_id: examId,
          attempt_id: attemptId,
          event_type: eventType,
          event_metadata: {
            ...metadata,
            count: currentCount,
            questionIndex: currentIndex + 1,
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    } catch (err) {
      console.warn('Suspicious event log error:', err);
    }
  };

  // 3. Listen for Tab Switches, Fullscreen Exits, Copy, and Context Menu
  useEffect(() => {
    // Visibility change (tab switch, window minimization)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSuspiciousEvent('tab_switch', { action: 'document_hidden' });
      }
    };

    // Fullscreen change
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logSuspiciousEvent('fullscreen_exit', { action: 'exited_fullscreen' });
      }
    };

    // Window blur
    const handleWindowBlur = () => {
      logSuspiciousEvent('window_blur', { action: 'window_lost_focus' });
    };

    // Context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logSuspiciousEvent('context_menu', { action: 'right_click_prevented' });
    };

    // Copy / Cut / PrintScreen keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'x', 'a', 'p', 'u', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        logSuspiciousEvent('copy_attempt', { key: e.key });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examId, attemptId, currentIndex]);

  // 4. Save Answer to Supabase
  const saveAnswerToBackend = async (questionId: string, selectedIds: string[]) => {
    if (!attemptId) return;
    setIsSaving(true);

    try {
      await supabase.from('attempt_answers').upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_ids: selectedIds,
          is_answered: selectedIds.length > 0,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id,question_id' }
      );
    } catch (err) {
      console.error('Failed to sync answer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Handle Option Selection
  const handleSelectOption = (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    let updatedSelection: string[];

    if (currentQ.question_type === 'multiple_choice') {
      const existing = answers[currentQ.id] || [];
      if (existing.includes(optionId)) {
        updatedSelection = existing.filter((id) => id !== optionId);
      } else {
        updatedSelection = [...existing, optionId];
      }
    } else {
      // Single choice or true/false: single selection
      updatedSelection = [optionId];
    }

    // Update state
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updatedSelection,
    }));

    // Auto-save to backend
    saveAnswerToBackend(currentQ.id, updatedSelection);
  };

  // 6. Navigation Handlers
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVisitedIndices((prev) => new Set([...prev, nextIdx]));
    } else {
      // Last question -> open submit confirmation
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrev = () => {
    if (exam?.navigation_mode === 'next_only') return; // Mode 2 lock
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSelectQuestionFromPalette = (index: number) => {
    if (exam?.navigation_mode === 'next_only' && index !== currentIndex) {
      return; // Cannot jump in next-only mode
    }
    setCurrentIndex(index);
    setVisitedIndices((prev) => new Set([...prev, index]));
  };

  // 7. Examination Submission (Calls Server-Side RPC `submit_exam_attempt`)
  const handleSubmitExam = async () => {
    if (!attemptId || !examId) return;
    setIsSubmitting(true);

    try {
      // Call secure Supabase RPC function
      const { data, error } = await supabase.rpc('submit_exam_attempt', {
        p_attempt_id: attemptId,
      });

      if (error) throw error;

      // Exit fullscreen if active
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }

      // Redirect to score / result page
      navigate(`/exam/${examId}/result/${attemptId}`, { replace: true });
    } catch (err: any) {
      console.error('Submission error:', err);
      alert('Error submitting examination. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading examination environment..." />;
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Questions in Examination</h2>
        <p className="mt-1 text-xs text-slate-500">The teacher has not added questions to this examination yet.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredQuestionIndices = new Set<number>();
  questions.forEach((q, idx) => {
    if (answers[q.id] && answers[q.id].length > 0) {
      answeredQuestionIndices.add(idx);
    }
  });

  const totalAnswered = answeredQuestionIndices.size;
  const totalUnanswered = questions.length - totalAnswered;

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 no-select pb-12">
      
      {/* Anti-Cheat Dynamic Watermark Overlay */}
      <Watermark
        studentName={profile?.full_name || 'Student'}
        phone={profile?.phone || ''}
        examId={examId || ''}
      />

      {/* Warning Toast */}
      {warning && (
        <AntiCheatWarning
          type={warning.type}
          count={warning.count}
          onDismiss={() => setWarning(null)}
        />
      )}

      {/* Top Fixed Examination Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              Class {exam?.class}
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {exam?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {exam && (
              <ExamTimer
                timerMode={exam.timer_mode}
                totalDurationSeconds={exam.duration_seconds}
                questionTimeLimitSeconds={currentQ.time_limit_seconds || 60}
                currentQuestionIndex={currentIndex}
                startedAt={attempt?.started_at}
                onTimeExpired={handleSubmitExam}
                onQuestionTimeExpired={handleNext}
              />
            )}

            {/* Quick Submit Button */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Examination Layout */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Question Card (Col 1-3) */}
          <div className="lg:col-span-3 space-y-4">
            <QuestionCard
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              question={currentQ}
              selectedOptionIds={answers[currentQ.id] || []}
              onSelectOption={handleSelectOption}
              isSaving={isSaving}
            />

            {/* Bottom Question Controls */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                type="button"
                disabled={currentIndex === 0 || exam?.navigation_mode === 'next_only'}
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
              >
                <span>{currentIndex === questions.length - 1 ? 'Finish & Review' : 'Save & Next'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Question Palette Sidebar (Col 4) */}
          <div className="lg:col-span-1 space-y-4">
            <QuestionPalette
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              visitedIndices={visitedIndices}
              answeredIndices={answeredQuestionIndices}
              navigationMode={exam?.navigation_mode || 'both'}
              onSelectQuestion={handleSelectQuestionFromPalette}
            />

            {/* Proctored Warning Note */}
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-[11px] text-amber-800 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Proctored Assessment Session
              </p>
              <p className="leading-snug">
                Your examination responses are auto-saved in real-time. Do not close your browser or change tabs.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Submit Confirmation Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmitExam}
        isSubmitting={isSubmitting}
        totalQuestions={questions.length}
        answeredCount={totalAnswered}
        unansweredCount={totalUnanswered}
      />

    </div>
  );
};
