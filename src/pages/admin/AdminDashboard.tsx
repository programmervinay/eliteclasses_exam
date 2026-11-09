import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Award, 
  ShieldAlert, 
  Plus, 
  Upload, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  GraduationCap,
  ArrowRight,
  Radio
} from 'lucide-react';
import { supabase, APP_CONFIG } from '../../lib/supabase';
import { StatCard } from '../../components/admin/StatCard';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ExamFormModal } from '../../components/admin/ExamFormModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Profile, Exam, ExamResult, SuspiciousEvent } from '../../types/database';

export const AdminDashboard: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [suspiciousEvents, setSuspiciousEvents] = useState<SuspiciousEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: stData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (stData) setStudents(stData as Profile[]);

      // 2. Fetch Exams
      const { data: exData } = await supabase
        .from('exams')
        .select('*, subject:subjects(*)')
        .order('created_at', { ascending: false });
      if (exData) setExams(exData as Exam[]);

      // 3. Fetch Results
      const { data: resData, error: resErr } = await supabase
        .from('results')
        .select('*, student:profiles(*), exam:exams(*)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!resErr && resData && resData.length > 0) {
        setResults(resData as ExamResult[]);
      } else {
        const { data: rawRes } = await supabase
          .from('results')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        const pMap = new Map((stData || []).map((p: any) => [p.id, p]));
        const eMap = new Map((exData || []).map((e: any) => [e.id, e]));
        const enriched = (rawRes || []).map((r: any) => ({
          ...r,
          student: pMap.get(r.student_id),
          exam: eMap.get(r.exam_id),
        }));
        setResults(enriched as ExamResult[]);
      }

      // 4. Fetch Suspicious Events count
      const { data: spData, error: spErr } = await supabase
        .from('suspicious_events')
        .select('*, student:profiles(*), exam:exams(*)')
        .order('occurred_at', { ascending: false })
        .limit(5);

      if (!spErr && spData && spData.length > 0) {
        setSuspiciousEvents(spData as SuspiciousEvent[]);
      } else {
        const { data: rawSp } = await supabase
          .from('suspicious_events')
          .select('*')
          .order('occurred_at', { ascending: false })
          .limit(5);

        const pMap = new Map((stData || []).map((p: any) => [p.id, p]));
        const eMap = new Map((exData || []).map((e: any) => [e.id, e]));
        const enrichedSp = (rawSp || []).map((s: any) => ({
          ...s,
          student: pMap.get(s.student_id),
          exam: eMap.get(s.exam_id),
        }));
        setSuspiciousEvents(enrichedSp as SuspiciousEvent[]);
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading teacher dashboard..." />;
  }

  // Calculate Statistics
  const registeredStudents = students.filter((s) => s.role === 'student');
  const publishedExams = exams.filter((e) => e.status === 'published');
  const totalSubmissions = results.length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
    : 0;

  // Class distribution
  const classCounts: Record<string, number> = {
    '6th': 0,
    '7th': 0,
    '8th': 0,
    '9th': 0,
    '10th': 0,
  };
  registeredStudents.forEach((st) => {
    if (classCounts[st.class] !== undefined) {
      classCounts[st.class] += 1;
    }
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Teacher Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by {APP_CONFIG.creator} • Real-time overview of examinations & student submissions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/notifications"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
              title="Broadcast Web Push Notifications to students"
            >
              <Radio className="h-4 w-4 animate-pulse" />
              <span>Send Notifications</span>
            </Link>

            <button
              onClick={() => setIsExamModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Examination</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Students"
            value={registeredStudents.length}
            subtitle="Registered across 6th–10th"
            icon={Users}
            color="brand"
          />
          <StatCard
            title="Active Exams"
            value={publishedExams.length}
            subtitle={`${exams.length} Total created`}
            icon={BookOpen}
            color="emerald"
          />
          <StatCard
            title="Evaluated Tests"
            value={results.length}
            subtitle="Completed student attempts"
            icon={Award}
            color="purple"
          />
          <StatCard
            title="Class Average"
            value={`${avgScore}%`}
            subtitle="Across all evaluations"
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* Class-Wise Student Distribution */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Students by Class Standard
            </h2>
            <Link to="/admin/students" className="text-xs font-semibold text-brand-600 hover:underline">
              View All Students →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(classCounts).map(([cls, count]) => (
              <div
                key={cls}
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-center"
              >
                <span className="text-xs font-bold text-slate-500">Class {cls}</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {count}
                </p>
                <span className="text-[10px] text-slate-400">Enrolled Students</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Grid: Recent Submissions & Suspicious Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Submissions (2 Cols) */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Examination Submissions
              </h2>
              <Link to="/admin/results" className="text-xs font-semibold text-brand-600 hover:underline">
                View All Results
              </Link>
            </div>

            {results.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No student submissions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="pb-3">Student</th>
                      <th className="pb-3">Class</th>
                      <th className="pb-3">Examination</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.map((res) => (
                      <tr key={res.id}>
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {res.student?.full_name || 'Student'}
                        </td>
                        <td className="py-3 text-slate-500">
                          Class {res.student?.class}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {res.exam?.title}
                        </td>
                        <td className="py-3 font-mono font-bold">
                          {res.marks_obtained}/{res.total_marks} ({res.percentage}%)
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            res.result_status === 'pass'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {res.result_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Suspicious Events Feed (1 Col) */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span>Monitoring Alerts</span>
              </h2>
              <Link to="/admin/suspicious" className="text-xs font-semibold text-amber-600 hover:underline">
                View Log
              </Link>
            </div>

            {suspiciousEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No suspicious interruptions recorded.</p>
            ) : (
              <div className="space-y-3">
                {suspiciousEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {evt.student?.full_name || 'Student'}
                      </span>
                      <span className="text-[10px]">
                        {new Date(evt.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-mono text-amber-700 dark:text-amber-400 text-[11px]">
                      {evt.event_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {evt.exam?.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal for creating examination */}
        <ExamFormModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          onSaved={loadData}
        />

      </main>
    </div>
  );
};
