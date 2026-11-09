import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  HelpCircle, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Filter,
  Eye,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ExamFormModal } from '../../components/admin/ExamFormModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Exam, StudentClass, ExamStatus } from '../../types/database';

export const AdminExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, subject:subjects(*), questions(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data as any[]);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (exam: Exam) => {
    const newStatus: ExamStatus = exam.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('exams')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', exam.id);
      if (error) throw error;
      fetchExams();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this examination? All student attempts and questions for this test will be removed.')) {
      return;
    }

    try {
      const { error } = await supabase.from('exams').delete().eq('id', examId);
      if (error) throw error;
      fetchExams();
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };

  const filteredExams = exams.filter((e) => {
    if (selectedClass !== 'all' && e.class !== selectedClass) return false;
    if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
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
              Manage Examinations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, edit, schedule, and publish examinations for Classes 6th to 10th
            </p>
          </div>

          <button
            onClick={() => {
              setExamToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Exam</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>

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
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft (Hidden)</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>

          <span className="text-xs text-slate-400 ml-auto">
            Showing {filteredExams.length} examinations
          </span>
        </div>

        {/* Exams Table */}
        {loading ? (
          <LoadingSpinner message="Loading examinations..." />
        ) : filteredExams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <BookOpen className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Examinations Found</h3>
            <p className="mt-1 text-xs text-slate-500">Create an examination to get started.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Examination</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Marks</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExams.map((exam) => {
                    const isPublished = exam.status === 'published';
                    const qCount = (exam as any).questions?.[0]?.count || 0;

                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {exam.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {qCount} Questions • Timer: {exam.timer_mode}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Class {exam.class}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {exam.subject?.name || 'General'}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                          {Math.round(exam.duration_seconds / 60)}m
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {exam.total_marks}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(exam)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Click to toggle publish status"
                          >
                            {exam.status}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/admin/questions?examId=${exam.id}`}
                              className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg dark:hover:bg-brand-950"
                              title="Manage Questions"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setExamToEdit(exam);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              title="Edit Settings"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-1.5 text-red-500 hover:text-red-700"
                              title="Delete Examination"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for creating / editing examination */}
        <ExamFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchExams}
          examToEdit={examToEdit}
        />

      </main>
    </div>
  );
};
