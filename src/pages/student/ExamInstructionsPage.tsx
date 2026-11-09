import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Clock, 
  Award, 
  ShieldAlert, 
  CheckSquare, 
  ArrowRight, 
  AlertCircle, 
  ArrowLeft,
  Eye,
  Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Exam } from '../../types/database';

export const ExamInstructionsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*, subject:subjects(*)')
          .eq('id', examId)
          .single();

        if (error) throw error;
        setExam(data as Exam);

        // Fetch question count
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);

        setQuestionCount(count || 0);
      } catch (err: any) {
        console.error('Error fetching exam instructions:', err);
        setErrorMsg('Failed to load examination details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading examination instructions..." />;
  }

  if (!exam || errorMsg) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Examination Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">{errorMsg || 'The requested examination is not accessible.'}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleStartExam = async () => {
    if (!agreed || !user || !examId) return;

    setStarting(true);
    setErrorMsg(null);

    try {
      // 1. Check if an active attempt exists
      const { data: existingAttempts } = await supabase
        .from('attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingAttempts && existingAttempts.length > 0) {
        // Resume existing in_progress attempt
        navigate(`/exam/${examId}/session/${existingAttempts[0].id}`);
        return;
      }

      // Check max attempts limit
      const { data: pastSubmissions } = await supabase
        .from('attempts')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .eq('status', 'submitted');

      if (pastSubmissions && pastSubmissions.length >= (exam.max_attempts || 1)) {
        setErrorMsg(`You have already completed the maximum allowed attempts (${exam.max_attempts}) for this exam.`);
        setStarting(false);
        return;
      }

      // 2. Create a new attempt record
      const { data: newAttempt, error: attemptErr } = await supabase
        .from('attempts')
        .insert([
          {
            exam_id: examId,
            student_id: user.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (attemptErr) throw attemptErr;

      // 3. Navigate into fullscreen exam session
      navigate(`/exam/${examId}/session/${newAttempt.id}`);
    } catch (err: any) {
      console.error('Error starting attempt:', err);
      setErrorMsg(err.message || 'Unable to initialize examination session.');
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl">
        
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              Class {exam.class} • {exam.subject?.name || 'General'}
            </span>
            {exam.topic && (
              <span className="text-xs text-slate-400 font-medium">Topic: {exam.topic}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {exam.description}
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Exam Parameter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 text-center">
            <Clock className="mx-auto h-5 w-5 text-brand-500 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Duration</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {exam.timer_mode === 'none' ? 'No Limit' : `${Math.round(exam.duration_seconds / 60)} Mins`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 text-center">
            <Award className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Marks</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {exam.total_marks}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 text-center">
            <CheckSquare className="mx-auto h-5 w-5 text-indigo-500 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Questions</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {questionCount} Questions
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 text-center">
            <ShieldAlert className="mx-auto h-5 w-5 text-amber-500 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Pass Marks</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {exam.passing_marks} Marks
            </p>
          </div>
        </div>

        {/* Examination Rules & Anti-Cheating Protocol */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Important Examination Instructions
          </h3>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {exam.instructions || 'Read every question carefully before selecting an answer.'}
            </p>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold">•</span>
              <span>
                <strong>Attempt Policy:</strong> {exam.max_attempts === 1 ? '1 Attempt Only. Once submitted, you cannot reattempt this examination.' : exam.max_attempts >= 100 ? 'Unlimited Practice Reattempts Allowed.' : `Reattempts Allowed: Up to ${exam.max_attempts} total attempts permitted.`}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold">•</span>
              <span>
                <strong>Navigation Mode:</strong> {exam.navigation_mode === 'next_only' ? 'Next-Only mode is enabled. Once you submit an answer and move forward, previous questions cannot be revisited.' : 'Previous + Next mode is enabled. You can freely revisit questions using the palette.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold">•</span>
              <span>
                <strong>Negative Marking:</strong> {exam.negative_marking_enabled ? 'Active. Incorrect responses will deduct negative marks.' : 'Not enabled. No marks are deducted for incorrect answers.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold">•</span>
              <span>
                <strong>Anti-Cheat Proctored Screen:</strong> The system will prompt you for <strong>Fullscreen mode</strong>. Exiting fullscreen, switching browser tabs, or minimizing will be logged to your teacher's monitoring log.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold">•</span>
              <span>
                <strong>Dynamic Watermark:</strong> Your name ({profile?.full_name}) and masked phone number are subtly watermarked across the exam screen to protect assessment integrity.
              </span>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="pt-2 mb-8">
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-brand-50/50 dark:bg-brand-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              I certify that I am <strong>{profile?.full_name}</strong>. I will complete this test independently without using external AI tools, second devices, or switching browser tabs.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!agreed || starting}
            onClick={handleStartExam}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{starting ? 'Preparing Session...' : 'Enter Fullscreen & Begin Exam'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
