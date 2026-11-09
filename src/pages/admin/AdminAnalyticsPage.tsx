import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  CheckCircle2, 
  XCircle,
  BookOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ExamResult, Exam, Profile } from '../../types/database';

export const AdminAnalyticsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const { data: resData } = await supabase
          .from('results')
          .select('*, student:profiles(*), exam:exams(*, subject:subjects(*))');
        if (resData) setResults(resData as ExamResult[]);

        const { data: exData } = await supabase.from('exams').select('*');
        if (exData) setExams(exData as Exam[]);

        const { data: stData } = await supabase.from('profiles').select('*');
        if (stData) setStudents(stData as Profile[]);
      } catch (err) {
        console.error('Error fetching admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Analyzing institutional test data..." />;
  }

  // Calculations
  const totalSubmissions = results.length;
  const passedCount = results.filter((r) => r.result_status === 'pass').length;
  const overallPassRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
  const avgPercentage = totalSubmissions > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalSubmissions)
    : 0;

  // Class-wise performance
  const classStats: Record<string, { totalScore: number; count: number; passCount: number }> = {
    '6th': { totalScore: 0, count: 0, passCount: 0 },
    '7th': { totalScore: 0, count: 0, passCount: 0 },
    '8th': { totalScore: 0, count: 0, passCount: 0 },
    '9th': { totalScore: 0, count: 0, passCount: 0 },
    '10th': { totalScore: 0, count: 0, passCount: 0 },
  };

  results.forEach((r) => {
    const cls = r.student?.class;
    if (cls && classStats[cls]) {
      classStats[cls].totalScore += r.percentage;
      classStats[cls].count += 1;
      if (r.result_status === 'pass') classStats[cls].passCount += 1;
    }
  });

  // Subject-wise performance
  const subjectStats: Record<string, { totalScore: number; count: number }> = {};
  results.forEach((r) => {
    const sName = r.exam?.subject?.name || 'General';
    if (!subjectStats[sName]) {
      subjectStats[sName] = { totalScore: 0, count: 0 };
    }
    subjectStats[sName].totalScore += r.percentage;
    subjectStats[sName].count += 1;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Performance Analytics & Institutional Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated performance tracking, pass rates, and class comparisons
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Submissions</span>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{totalSubmissions}</p>
            <span className="text-[11px] text-slate-400">Total completed tests</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Average Percentage</span>
            <p className="mt-2 text-3xl font-black text-brand-600 dark:text-brand-400">{avgPercentage}%</p>
            <span className="text-[11px] text-slate-400">Student cohort average</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Overall Pass Rate</span>
            <p className="mt-2 text-3xl font-black text-emerald-600">{overallPassRate}%</p>
            <span className="text-[11px] text-slate-400">{passedCount} of {totalSubmissions} passed</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Students</span>
            <p className="mt-2 text-3xl font-black text-purple-600">{students.length}</p>
            <span className="text-[11px] text-slate-400">Enrolled active students</span>
          </div>
        </div>

        {/* Class-Wise Comparison Cards */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
            Class-Wise Performance Breakdown
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {Object.entries(classStats).map(([cls, data]) => {
              const classAvg = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
              const classPassRate = data.count > 0 ? Math.round((data.passCount / data.count) * 100) : 0;

              return (
                <div
                  key={cls}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-center"
                >
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Class {cls}</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {classAvg}%
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Average Score</span>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500">
                    Pass Rate: <strong>{classPassRate}%</strong> ({data.count} Tests)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject-Wise Mastery Progress */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
            Subject-Wise Cohort Average
          </h2>

          {Object.keys(subjectStats).length === 0 ? (
            <p className="text-xs text-slate-400">No subject submissions available yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(subjectStats).map(([name, data]) => {
                const avg = Math.round(data.totalScore / data.count);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-800 dark:text-slate-200">{name}</span>
                      <span className="text-brand-600 dark:text-brand-400">{avg}% ({data.count} submissions)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, avg)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
