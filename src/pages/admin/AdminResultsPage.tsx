import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { supabase, APP_CONFIG } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ExamResult, Exam } from '../../types/database';

export const AdminResultsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchResultsAndExams = async () => {
      setLoading(true);
      try {
        // Fetch all exams for filter
        const { data: exData } = await supabase.from('exams').select('*').order('title');
        if (exData) setExams(exData as Exam[]);

        // Fetch all results with joined student and exam
        const { data: resData, error: resErr } = await supabase
          .from('results')
          .select('*, student:profiles(*), exam:exams(*, subject:subjects(*))')
          .order('created_at', { ascending: false });

        if (!resErr && resData && resData.length > 0) {
          setResults(resData as ExamResult[]);
        } else {
          // Robust fallback: fetch raw results and manually link profiles & exams
          const { data: rawResults } = await supabase
            .from('results')
            .select('*')
            .order('created_at', { ascending: false });

          const { data: profiles } = await supabase.from('profiles').select('*');
          const { data: allExams } = await supabase.from('exams').select('*, subject:subjects(*)');

          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
          const examMap = new Map((allExams || []).map((e: any) => [e.id, e]));

          const enriched = (rawResults || []).map((r: any) => ({
            ...r,
            student: profileMap.get(r.student_id),
            exam: examMap.get(r.exam_id),
          }));
          setResults(enriched as ExamResult[]);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResultsAndExams();
  }, []);

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = [
      'Student Name',
      'Email',
      'Phone',
      'Class',
      'Examination',
      'Subject',
      'Marks Obtained',
      'Total Marks',
      'Percentage',
      'Status',
      'Correct Count',
      'Incorrect Count',
      'Unanswered Count',
      'Date',
    ];

    const rows = filteredResults.map((r) => [
      `"${r.student?.full_name || ''}"`,
      `"${r.student?.email || ''}"`,
      `"${r.student?.phone || ''}"`,
      `"${r.student?.class || ''}"`,
      `"${r.exam?.title || ''}"`,
      `"${r.exam?.subject?.name || ''}"`,
      r.marks_obtained,
      r.total_marks,
      `${r.percentage}%`,
      r.result_status.toUpperCase(),
      r.correct_count,
      r.incorrect_count,
      r.unanswered_count,
      `"${new Date(r.created_at).toLocaleDateString('en-IN')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `elite_classes_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = results.filter((r) => {
    if (selectedExamId !== 'all' && r.exam_id !== selectedExamId) return false;
    if (selectedClass !== 'all' && r.student?.class !== selectedClass) return false;
    if (selectedStatus !== 'all' && r.result_status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.student?.full_name?.toLowerCase().includes(q);
      const matchExam = r.exam?.title?.toLowerCase().includes(q);
      const matchPhone = r.student?.phone?.includes(q);
      return matchName || matchExam || matchPhone;
    }

    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Examination Results & Submissions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review evaluated student scores, pass percentages, and export performance rosters
            </p>
          </div>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredResults.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition-all disabled:opacity-40 self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Report</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or exam title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-1.5 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-xs truncate"
          >
            <option value="all">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Class {ex.class} - {ex.title}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Classes</option>
            <option value="6th">Class 6th</option>
            <option value="7th">Class 7th</option>
            <option value="8th">Class 8th</option>
            <option value="9th">Class 9th</option>
            <option value="10th">Class 10th</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Results</option>
            <option value="pass">Passed Only</option>
            <option value="fail">Failed Only</option>
          </select>
        </div>

        {/* Results Table */}
        {loading ? (
          <LoadingSpinner message="Loading examination results..." />
        ) : filteredResults.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <Award className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Results Found</h3>
            <p className="mt-1 text-xs text-slate-500">Student examination submissions will appear here automatically.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Examination</th>
                    <th className="p-4">Marks</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredResults.map((r) => {
                    const isPass = r.result_status === 'pass';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {r.student?.full_name || 'Student'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {r.student?.phone}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Class {r.student?.class}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                            {r.exam?.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {r.exam?.subject?.name || 'General'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.marks_obtained} / {r.total_marks}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={isPass ? 'text-emerald-600' : 'text-red-600'}>
                              {r.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({r.correct_count}C / {r.incorrect_count}I)
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPass
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {r.result_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
