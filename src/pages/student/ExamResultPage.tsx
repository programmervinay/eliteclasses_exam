import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Share2, 
  Eye, 
  Home, 
  AlertCircle,
  HelpCircle,
  GraduationCap,
  Zap,
  Trophy
} from 'lucide-react';
import { supabase, APP_CONFIG } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ExamResult } from '../../types/database';

export const ExamResultPage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const { profile } = useAuth();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId) return;
      try {
        const { data, error } = await supabase
          .from('results')
          .select('*, exam:exams(*, subject:subjects(*)), student:profiles(*)')
          .eq('attempt_id', attemptId)
          .single();

        if (error) throw error;
        setResult(data as ExamResult);

        // Fire confetti celebration if passed!
        if (data.result_status === 'pass') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error('Error fetching result:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Compiling verified scorecard..." />;
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scorecard Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">The result record could not be retrieved.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isPass = result.result_status === 'pass';
  const exam = result.exam;
  const student = result.student || profile;

  // WhatsApp Share URL to Teacher Vinay Prajapati
  const studentName = student?.full_name || 'Student';
  const studentClass = student?.class || '10th';
  const examTitle = exam?.title || 'Examination';
  const subjectName = exam?.subject?.name || 'General';
  const marksObtained = result.marks_obtained;
  const totalMarks = result.total_marks;
  const percentage = result.percentage;
  const resultId = result.id.slice(0, 8);
  const examDate = new Date(result.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const earnedXp = 50 + Math.round((Number(marksObtained) || 0) * 10) + (Number(percentage) >= 90 ? 50 : Number(percentage) >= 75 ? 25 : Number(percentage) >= 50 ? 15 : 0);

  const whatsappMessage = 
    `*Elite_Classes — Examination Result*\n\n` +
    `👤 *Student Name:* ${studentName}\n` +
    `🏷️ *Class:* ${studentClass}\n` +
    `📖 *Subject:* ${subjectName}\n` +
    `📝 *Examination:* ${examTitle}\n` +
    `🎯 *Marks Obtained:* ${marksObtained} / ${totalMarks}\n` +
    `📊 *Percentage:* ${percentage}%\n` +
    `🏆 *Result Status:* ${isPass ? 'PASSED ✅' : 'NEEDS IMPROVEMENT ⚠️'}\n` +
    `📅 *Examination Date:* ${examDate}\n` +
    `🔑 *Result Verification ID:* ${resultId}\n\n` +
    `_Official Scorecard generated on Elite_Classes (Powered by Vinay Prajapati)_`;

  const whatsappUrl = `https://wa.me/91${APP_CONFIG.adminWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Result Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl text-center">
        
        {/* Status Badge */}
        <div className="mb-6">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
            isPass
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/30'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-8 ring-amber-50 dark:ring-amber-950/30'
          }`}>
            <Award className="h-10 w-10" />
          </div>

          <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            isPass
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
          }`}>
            {isPass ? 'Examination Passed' : 'Needs Further Practice'}
          </span>

          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {examTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Class {studentClass} • Subject: {subjectName} • {examDate}
          </p>
        </div>

        {/* Big Score Box */}
        <div className="my-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 max-w-md mx-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Marks Obtained
          </span>
          <div className="mt-2 flex items-baseline justify-center gap-2">
            <span className="text-5xl sm:text-6xl font-black text-brand-600 dark:text-brand-400">
              {marksObtained}
            </span>
            <span className="text-2xl font-bold text-slate-400">
              / {totalMarks}
            </span>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            Score: <span className={isPass ? 'text-emerald-600' : 'text-amber-600'}>{percentage}%</span>
          </div>
        </div>

        {/* XP Points Award Card */}
        <div className="my-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-800/80 max-w-md mx-auto flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30">
              <Zap className="h-5 w-5 fill-slate-950" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block tracking-wider">Quiz XP Awarded</span>
              <span className="text-base font-black text-slate-900 dark:text-white">+{earnedXp} XP Points!</span>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm hover:bg-amber-50 dark:hover:bg-slate-800 transition-all"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Leaderboard</span>
          </Link>
        </div>

        {/* Detailed Question Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center max-w-md mx-auto">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 p-3">
            <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-semibold mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Correct</span>
            </div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {result.correct_count}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-3">
            <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-semibold mb-1">
              <XCircle className="h-4 w-4" />
              <span>Incorrect</span>
            </div>
            <p className="text-xl font-black text-red-700 dark:text-red-300">
              {result.incorrect_count}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-semibold mb-1">
              <HelpCircle className="h-4 w-4" />
              <span>Unanswered</span>
            </div>
            <p className="text-xl font-black text-slate-700 dark:text-slate-300">
              {result.unanswered_count}
            </p>
          </div>
        </div>

        {/* Actions (WhatsApp Share Button prominently placed) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          {/* Share on WhatsApp Button (to Vinay Prajapati) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-all hover:scale-105"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Result on WhatsApp</span>
          </a>

          {/* Review Answers Button (if allowed by teacher) */}
          {exam?.allow_review && (
            <Link
              to={`/exam/${examId}/review/${attemptId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/50 px-6 py-3.5 text-sm font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100"
            >
              <Eye className="h-4 w-4" />
              <span>Review Answer Key</span>
            </Link>
          )}

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

        </div>

      </div>
    </div>
  );
};
