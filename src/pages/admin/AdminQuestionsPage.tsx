import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { QuestionFormModal } from '../../components/admin/QuestionFormModal';
import { BulkImportModal } from '../../components/admin/BulkImportModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Exam, Question } from '../../types/database';

export const AdminQuestionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || '';

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<any | null>(null);

  // 1. Fetch all exams
  useEffect(() => {
    const fetchExams = async () => {
      const { data } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setExams(data as Exam[]);
        if (!selectedExamId) {
          setSelectedExamId(data[0].id);
        }
      }
    };
    fetchExams();
  }, []);

  // 2. Fetch questions for selected exam (including options and answer keys)
  const fetchQuestions = async () => {
    if (!selectedExamId) return;
    setLoading(true);

    try {
      // Questions with options and answer keys
      const { data, error } = await supabase
        .from('questions')
        .select('*, options:question_options(*), answer_key:answer_keys(*)')
        .eq('exam_id', selectedExamId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions();
      setSearchParams({ examId: selectedExamId });
    }
  }, [selectedExamId]);

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', qId);
      if (error) throw error;
      fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Question Manager
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add multiple choice questions, options, marks, and detailed teacher explanations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              disabled={!selectedExamId}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <Upload className="h-4 w-4" />
              <span>Bulk CSV Import</span>
            </button>

            <button
              onClick={() => {
                setQuestionToEdit(null);
                setIsQuestionModalOpen(true);
              }}
              disabled={!selectedExamId}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Exam Selection Dropdown */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Examination:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 max-w-xs sm:max-w-md truncate"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  Class {exam.class} — {exam.title}
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <div className="text-xs text-slate-500">
              Target Class: <strong className="text-slate-800 dark:text-slate-200">Class {selectedExam.class}</strong> • Marks: <strong className="text-slate-800 dark:text-slate-200">{selectedExam.total_marks}</strong>
            </div>
          )}
        </div>

        {/* Questions List */}
        {loading ? (
          <LoadingSpinner message="Loading questions..." />
        ) : questions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <HelpCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Questions in this Examination</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Click "Add Question" to create questions manually or "Bulk CSV Import" to upload multiple questions from an Excel/CSV file.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const options = (q.options || []).sort((a: any, b: any) => a.display_order - b.display_order);
              const correctIds = q.answer_key?.correct_option_ids || [];

              return (
                <div
                  key={q.id}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950 text-xs font-bold text-brand-600">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Question {idx + 1} • {q.question_type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        +{q.marks} Mark
                      </span>
                      {q.negative_marks > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
                          -{q.negative_marks} Neg
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionToEdit({
                            ...q,
                            answerKey: correctIds,
                          });
                          setIsQuestionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        title="Edit Question"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-red-500 hover:text-red-700"
                        title="Delete Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {q.question_text && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      {q.question_text}
                    </p>
                  )}

                  {q.image_url && (
                    <div className="mb-3 inline-block rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
                      <img
                        src={q.image_url}
                        alt={`Question ${idx + 1} Diagram`}
                        className="max-h-48 w-auto max-w-full rounded-xl object-contain"
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {options.map((opt: any, optIdx: number) => {
                      const isCorrect = correctIds.includes(opt.id);
                      const label = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-bold pt-0.5">{label}.</span>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {opt.option_text && <span className="block">{opt.option_text}</span>}
                            {opt.image_url && (
                              <img
                                src={opt.image_url}
                                alt={`Option ${label}`}
                                className="max-h-24 w-auto max-w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 object-contain"
                              />
                            )}
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 shrink-0 pt-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for adding/editing questions */}
        <QuestionFormModal
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          onSaved={fetchQuestions}
          examId={selectedExamId}
          questionToEdit={questionToEdit}
        />

        {/* Modal for bulk CSV import */}
        <BulkImportModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onImported={fetchQuestions}
          examId={selectedExamId}
        />

      </main>
    </div>
  );
};
