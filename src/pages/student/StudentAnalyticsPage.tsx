import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Award, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ExamResult } from '../../types/database';

export const StudentAnalyticsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('results')
          .select('*, exam:exams(*, subject:subjects(*))')
          .eq('student_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setResults((data || []) as ExamResult[]);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Crunching performance data..." />;
  }

  // Calculate metrics
  const totalCompleted = results.length;
  const totalCorrect = results.reduce((acc, r) => acc + r.correct_count, 0);
  const totalIncorrect = results.reduce((acc, r) => acc + r.incorrect_count, 0);
  const totalUnanswered = results.reduce((acc, r) => acc + r.unanswered_count, 0);
  const totalQuestions = totalCorrect + totalIncorrect + totalUnanswered;

  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgPercentage = totalCompleted > 0
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalCompleted)
    : 0;
  const highestPercentage = totalCompleted > 0
    ? Math.max(...results.map((r) => r.percentage))
    : 0;

  // Group by Subject
  const subjectScores: Record<string, { total: number; count: number; name: string }> = {};
  results.forEach((r) => {
    const sName = r.exam?.subject?.name || 'General';
    if (!subjectScores[sName]) {
      subjectScores[sName] = { total: 0, count: 0, name: sName };
    }
    subjectScores[sName].total += r.percentage;
    subjectScores[sName].count += 1;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
          Student Performance Analytics
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Performance Analytics for {profile?.full_name}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed metrics tracking your scores, accuracy, and subject trends.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
          <p className="mt-2 text-3xl font-black text-brand-600 dark:text-brand-400">{avgPercentage}%</p>
          <span className="text-[11px] text-slate-400">{totalCompleted} tests completed</span>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Top Score</span>
          <p className="mt-2 text-3xl font-black text-emerald-600">{highestPercentage}%</p>
          <span className="text-[11px] text-slate-400">Best performance</span>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Accuracy Rate</span>
          <p className="mt-2 text-3xl font-black text-purple-600">{overallAccuracy}%</p>
          <span className="text-[11px] text-slate-400">{totalCorrect} / {totalQuestions} correct</span>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Questions</span>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{totalQuestions}</p>
          <span className="text-[11px] text-slate-400">Answered & evaluated</span>
        </div>
      </div>

      {/* Subject-Wise Mastery Progress */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm mb-8">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Subject-Wise Mastery Breakdown
        </h2>

        {Object.keys(subjectScores).length === 0 ? (
          <p className="text-xs text-slate-400">No subject tests recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.values(subjectScores).map((sub) => {
              const avg = Math.round(sub.total / sub.count);
              return (
                <div key={sub.name}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">{sub.name}</span>
                    <span className="text-brand-600 dark:text-brand-400">{avg}% ({sub.count} tests)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, avg)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Attempts Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Historical Examination Log
        </h2>

        {results.length === 0 ? (
          <p className="text-xs text-slate-400">No examination attempts on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Examination</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((res) => (
                  <tr key={res.id}>
                    <td className="py-3 text-slate-500">
                      {new Date(res.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {res.exam?.title}
                    </td>
                    <td className="py-3 text-slate-500">
                      {res.exam?.subject?.name || 'General'}
                    </td>
                    <td className="py-3 font-mono font-bold">
                      {res.marks_obtained}/{res.total_marks} ({res.percentage}%)
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        res.result_status === 'pass'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950'
                          : 'bg-red-50 text-red-600 dark:bg-red-950'
                      }`}>
                        {res.result_status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/exam/${res.exam_id}/result/${res.attempt_id}`}
                        className="text-xs font-bold text-brand-600 hover:underline"
                      >
                        View Scorecard
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
