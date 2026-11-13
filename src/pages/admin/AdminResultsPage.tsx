import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  FileSpreadsheet,
  X,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  BookOpen,
  User,
  GraduationCap,
  Loader2,
  Sparkles
} from 'lucide-react';
import { supabase, APP_CONFIG } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ExamResult, Exam, ReviewQuestionItem } from '../../types/database';

export const AdminResultsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [selectedReviewResult, setSelectedReviewResult] = useState<ExamResult | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestionItem[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'unanswered'>('all');

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

  const handleOpenReview = async (res: ExamResult) => {
    setSelectedReviewResult(res);
    setLoadingReview(true);
    setReviewFilter('all');

    try {
      const { data, error } = await supabase.rpc('get_attempt_review', {
        p_attempt_id: res.attempt_id,
      });

      if (error) throw error;
      setReviewQuestions((data || []) as ReviewQuestionItem[]);
    } catch (err: any) {
      console.error('Error fetching review data:', err);
      alert(`Could not load answer review: ${err.message || 'Please try again.'}`);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleCloseReview = () => {
    setSelectedReviewResult(null);
    setReviewQuestions([]);
  };

  const filteredReviewQuestions = reviewQuestions.filter((q) => {
    const selected = q.selected_option_ids || [];
    const correct = q.correct_option_ids || [];
    const isAnswered = q.is_answered;
    const isCorrect = isAnswered && 
      selected.length === correct.length && 
      selected.every((id) => correct.includes(id));

    if (reviewFilter === 'correct') return isCorrect;
    if (reviewFilter === 'incorrect') return isAnswered && !isCorrect;
    if (reviewFilter === 'unanswered') return !isAnswered;
    return true;
  });

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
                    <th className="p-4 text-right">Actions</th>
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
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 transition-all shadow-sm"
                            title="Check what student marked"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review Answers</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Student Answer Review Modal */}
        {selectedReviewResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              
              {/* Modal Sticky Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      Class {selectedReviewResult.student?.class}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedReviewResult.exam?.title} ({selectedReviewResult.exam?.subject?.name || 'General'})
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedReviewResult.student?.full_name || 'Student'}</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      ({selectedReviewResult.student?.phone || 'No phone'})
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Score: {selectedReviewResult.marks_obtained} / {selectedReviewResult.total_marks} ({selectedReviewResult.percentage}%)
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">{selectedReviewResult.correct_count} Correct</span>
                    <span>•</span>
                    <span className="text-red-500 font-semibold">{selectedReviewResult.incorrect_count} Incorrect</span>
                    <span>•</span>
                    <span className="text-slate-400 font-semibold">{selectedReviewResult.unanswered_count} Unanswered</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/exam/${selectedReviewResult.exam_id}/review/${selectedReviewResult.attempt_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm"
                    title="Open in standalone page / Print"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-brand-600" />
                    <span>Open Full Page</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleCloseReview}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Review Filter Bar */}
              <div className="px-6 py-2.5 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    reviewFilter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All Questions ({reviewQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('incorrect')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    reviewFilter === 'incorrect'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100'
                  }`}
                >
                  ❌ Incorrect Only ({selectedReviewResult.incorrect_count})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('correct')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    reviewFilter === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  ✅ Correct Only ({selectedReviewResult.correct_count})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('unanswered')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    reviewFilter === 'unanswered'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ❓ Unanswered Only ({selectedReviewResult.unanswered_count})
                </button>
              </div>

              {/* Scrollable Questions Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {loadingReview ? (
                  <div className="py-16 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-2" />
                    <p className="text-xs text-slate-500">Loading student's marked answer sheet...</p>
                  </div>
                ) : filteredReviewQuestions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No questions matching the selected filter ({reviewFilter}).
                  </div>
                ) : (
                  filteredReviewQuestions.map((q, idx) => {
                    const selected = q.selected_option_ids || [];
                    const correct = q.correct_option_ids || [];
                    const isAnswered = q.is_answered;
                    const isCorrect = isAnswered &&
                      selected.length === correct.length &&
                      selected.every((id) => correct.includes(id));

                    return (
                      <div
                        key={q.question_id}
                        className={`rounded-3xl border p-5 sm:p-6 shadow-sm transition-all ${
                          !isAnswered
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            : isCorrect
                            ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                            : 'border-red-300 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/20'
                        }`}
                      >
                        {/* Question Meta Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              Question {idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isAnswered ? (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <HelpCircle className="h-3.5 w-3.5" /> Skipped / Unanswered
                              </span>
                            ) : isCorrect ? (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+{q.marks} Mark)
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-300 dark:border-red-800">
                                <XCircle className="h-3.5 w-3.5" /> Student Answered Wrong {q.negative_marks > 0 && `(-${q.negative_marks})`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Text */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed mb-3">
                          {q.question_text}
                        </h3>

                        {/* Question Diagram Image */}
                        {q.image_url && (
                          <div className="mb-4 inline-block w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
                            <img
                              src={q.image_url}
                              alt="Question Diagram"
                              className="mx-auto max-h-60 w-auto max-w-full rounded-xl object-contain"
                            />
                          </div>
                        )}

                        {/* Options List */}
                        <div className="space-y-2 mb-4">
                          {q.options && q.options.map((opt, optIdx) => {
                            const isStudentMarked = selected.includes(opt.id);
                            const isCorrectAnswer = correct.includes(opt.id);
                            const label = String.fromCharCode(65 + optIdx);

                            let optStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';
                            if (isCorrectAnswer) {
                              optStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500';
                            } else if (isStudentMarked && !isCorrectAnswer) {
                              optStyle = 'border-red-400 bg-red-50/80 dark:bg-red-950/60 text-red-950 dark:text-red-100 font-medium ring-1 ring-red-400';
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-xs sm:text-sm ${optStyle}`}
                              >
                                <span className="font-bold shrink-0">{label}.</span>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  {opt.text && <span className="block">{opt.text}</span>}
                                  {opt.image_url && (
                                    <img
                                      src={opt.image_url}
                                      alt={`Option ${label}`}
                                      className="max-h-32 w-auto max-w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1 object-contain"
                                    />
                                  )}
                                </div>

                                {/* Option Badges */}
                                {isStudentMarked && isCorrectAnswer && (
                                  <span className="shrink-0 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 border border-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Marked by Student (Correct)
                                  </span>
                                )}
                                {isStudentMarked && !isCorrectAnswer && (
                                  <span className="shrink-0 text-red-700 dark:text-red-300 font-bold flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900 border border-red-300">
                                    <XCircle className="h-3.5 w-3.5" /> Marked by Student (Wrong)
                                  </span>
                                )}
                                {!isStudentMarked && isCorrectAnswer && (
                                  <span className="shrink-0 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300/60">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Correct Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Teacher Solution / Explanation */}
                        {q.explanation && (
                          <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-3.5 text-xs text-blue-900 dark:text-blue-200">
                            <div className="flex items-center gap-1.5 font-bold mb-1 text-blue-700 dark:text-blue-300">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <span>Academic Explanation:</span>
                            </div>
                            <p className="leading-relaxed pl-5">
                              {q.explanation}
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Sticky Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
                <span className="text-xs text-slate-500">
                  Showing {filteredReviewQuestions.length} of {reviewQuestions.length} questions
                </span>
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-all shadow-sm"
                >
                  Close Review
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
