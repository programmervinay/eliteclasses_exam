import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Award, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  Filter, 
  BarChart2,
  Share2,
  FileText
} from 'lucide-react';
import { supabase, APP_CONFIG } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Exam, Attempt, ExamResult, Subject } from '../../types/database';

export const StudentDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'completed' | 'all'>('available');

  const studentClass = profile?.class || '10th';

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch exams for student's class
        const { data: examsData } = await supabase
          .from('exams')
          .select('*, subject:subjects(*)')
          .eq('class', studentClass)
          .in('status', ['published', 'scheduled', 'completed'])
          .order('created_at', { ascending: false });

        if (examsData) setExams(examsData as Exam[]);

        // 2. Fetch student's attempts
        if (user) {
          const { data: attemptsData } = await supabase
            .from('attempts')
            .select('*, exam:exams(*)')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false });

          if (attemptsData) setAttempts(attemptsData as Attempt[]);

          // 3. Fetch results
          const { data: resultsData } = await supabase
            .from('results')
            .select('*, exam:exams(*)')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false });

          if (resultsData) setResults(resultsData as ExamResult[]);
        }

        // 4. Fetch subjects for this class
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .eq('class', studentClass)
          .order('name');

        if (subjectsData) setSubjects(subjectsData as Subject[]);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [studentClass, user]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading examination schedule..." />;
  }

  // Calculate statistics
  const totalAvailableExams = exams.length;
  const attemptedExamIds = new Set(attempts.map((a) => a.exam_id));
  const completedAttempts = attempts.filter((a) => a.status === 'submitted');
  const totalCompleted = completedAttempts.length;

  const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
  const averagePercentage = totalCompleted > 0 ? Math.round(totalScore / totalCompleted) : 0;
  const highestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((a) => a.percentage || 0))
    : 0;

  // Filter exams by selected subject
  const filteredExams = exams.filter((exam) => {
    if (selectedSubject !== 'all' && exam.subject_id !== selectedSubject) {
      return false;
    }
    return true;
  });

  const availableExams = filteredExams.filter((exam) => !attemptedExamIds.has(exam.id) && exam.status === 'published');
  const userCompletedResults = results.filter((res) => {
    if (selectedSubject !== 'all' && res.exam?.subject_id !== selectedSubject) {
      return false;
    }
    return true;
  });

  const getWhatsAppShareUrl = (result: ExamResult) => {
    const studentName = profile?.full_name || 'Student';
    const examTitle = result.exam?.title || 'Examination';
    const marks = `${result.marks_obtained} / ${result.total_marks}`;
    const percent = `${result.percentage}%`;
    const status = result.result_status.toUpperCase();
    const date = new Date(result.created_at).toLocaleDateString('en-IN');

    const message = 
      `*Elite_Classes Examination Result*\n\n` +
      `👤 *Student:* ${studentName}\n` +
      `🏷️ *Class:* ${studentClass}\n` +
      `📝 *Exam:* ${examTitle}\n` +
      `🎯 *Score:* ${marks} (${percent})\n` +
      `🏆 *Status:* ${status}\n` +
      `📅 *Date:* ${date}\n` +
      `🔑 *Result ID:* ${result.id.slice(0, 8)}\n\n` +
      `_Powered by Vinay Prajapati_`;

    return `https://wa.me/91${APP_CONFIG.adminWhatsApp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/15 mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
              <GraduationCap className="h-3.5 w-3.5" />
              Class {studentClass} Standard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name || 'Student'}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-brand-100 max-w-xl">
              {profile?.school_name ? `${profile.school_name} • ` : ''}
              Track your scheduled tests, take proctored quizzes, and view verified performance reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/analytics"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/20 transition-all"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Full Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {availableExams.length}
          </p>
          <span className="text-[11px] text-slate-400">Ready to attempt</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalCompleted}
          </p>
          <span className="text-[11px] text-slate-400">Evaluated tests</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {averagePercentage}%
          </p>
          <span className="text-[11px] text-slate-400">Overall score</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Score</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {highestScore}%
          </p>
          <span className="text-[11px] text-slate-400">Highest achieved</span>
        </div>
      </div>

      {/* Subject Filter Bar & Category Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'available'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Available Tests ({availableExams.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed Tests ({userCompletedResults.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Exams ({filteredExams.length})
          </button>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full sm:w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'available' && (
        <div>
          {availableExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Caught Up!
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No pending examinations for Class {studentClass} right now. Check back soon for upcoming tests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/50">
                        {exam.subject?.name || 'General'}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {exam.title}
                    </h3>

                    {exam.topic && (
                      <p className="text-xs text-slate-500 mt-1">Topic: {exam.topic}</p>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {exam.description || 'Comprehensive test evaluating subject comprehension.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{Math.round(exam.duration_seconds / 60)} Mins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-slate-400" />
                        <span>{exam.total_marks} Marks</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to={`/exam/${exam.id}/instructions`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
                    >
                      <span>Start Examination</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div>
          {userCompletedResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Completed Examinations
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                You haven't completed any examinations yet. Start with one of the available tests!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userCompletedResults.map((result) => {
                const isPass = result.result_status === 'pass';
                const exam = result.exam;

                return (
                  <div
                    key={result.id}
                    className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isPass
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200'
                            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200'
                        }`}>
                          {isPass ? 'Passed' : 'Needs Improvement'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(result.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {exam?.title || 'Examination'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>Score: <strong className="text-slate-800 dark:text-slate-200">{result.marks_obtained} / {result.total_marks}</strong></span>
                        <span>•</span>
                        <span>Percentage: <strong className={isPass ? 'text-emerald-600' : 'text-red-600'}>{result.percentage}%</strong></span>
                        <span>•</span>
                        <span>Correct: {result.correct_count}</span>
                        <span>•</span>
                        <span>Incorrect: {result.incorrect_count}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <Link
                        to={`/exam/${result.exam_id}/result/${result.attempt_id}`}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        Scorecard
                      </Link>

                      {exam?.allow_review && (
                        <Link
                          to={`/exam/${result.exam_id}/review/${result.attempt_id}`}
                          className="rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-950/60 px-3.5 py-2 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100"
                        >
                          Review Answers
                        </Link>
                      )}

                      <a
                        href={getWhatsAppShareUrl(result)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
                        title="Share Result on WhatsApp with Teacher"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const hasAttempted = attemptedExamIds.has(exam.id);
            return (
              <div
                key={exam.id}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                      {exam.subject?.name || 'Class ' + exam.class}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      hasAttempted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {hasAttempted ? 'Attempted' : 'Available'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {hasAttempted ? (
                    <span className="block text-center text-xs font-semibold text-slate-400 py-1">
                      Already Submitted
                    </span>
                  ) : (
                    <Link
                      to={`/exam/${exam.id}/instructions`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-all"
                    >
                      <span>Take Examination</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
