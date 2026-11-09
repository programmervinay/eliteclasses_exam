import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ShieldCheck, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Exam, StudentClass, TimerMode, NavigationMode, ExamStatus, Subject } from '../../types/database';

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  examToEdit?: Exam | null;
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  examToEdit,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentClass, setStudentClass] = useState<StudentClass>('10th');
  const [subjectId, setSubjectId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<ExamStatus>('draft');
  const [durationValue, setDurationValue] = useState<number>(30);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'seconds'>('minutes');
  const [timerMode, setTimerMode] = useState<TimerMode>('exam');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('both');
  const [totalMarks, setTotalMarks] = useState(20);
  const [passingMarks, setPassingMarks] = useState(8);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [instructions, setInstructions] = useState(
    'Please read all questions carefully before submitting. Attempt all questions within the allowed time.'
  );

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('*').order('name');
      if (data) {
        setSubjects(data);
      }
    };
    fetchSubjects();
  }, []);

  // Populate when editing
  useEffect(() => {
    if (examToEdit) {
      setTitle(examToEdit.title);
      setDescription(examToEdit.description || '');
      setStudentClass(examToEdit.class);
      setSubjectId(examToEdit.subject_id || '');
      setTopic(examToEdit.topic || '');
      setStatus(examToEdit.status);

      setTimerMode(examToEdit.timer_mode);
      if (examToEdit.timer_mode === 'question') {
        if (examToEdit.duration_seconds < 60 || examToEdit.duration_seconds % 60 !== 0) {
          setDurationUnit('seconds');
          setDurationValue(examToEdit.duration_seconds || 60);
        } else {
          setDurationUnit('minutes');
          setDurationValue(Math.round(examToEdit.duration_seconds / 60) || 1);
        }
      } else {
        setDurationUnit('minutes');
        setDurationValue(Math.round(examToEdit.duration_seconds / 60) || 30);
      }

      setNavigationMode(examToEdit.navigation_mode);
      setTotalMarks(examToEdit.total_marks);
      setPassingMarks(examToEdit.passing_marks);
      setMaxAttempts(examToEdit.max_attempts || 1);
      setNegativeMarking(examToEdit.negative_marking_enabled);
      setShowResults(examToEdit.show_results);
      setAllowReview(examToEdit.allow_review);
      setInstructions(examToEdit.instructions || '');
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setStudentClass('10th');
      setTopic('');
      setStatus('published');
      setTimerMode('exam');
      setDurationUnit('minutes');
      setDurationValue(30);
      setNavigationMode('both');
      setTotalMarks(20);
      setPassingMarks(8);
      setMaxAttempts(1);
      setNegativeMarking(false);
      setShowResults(true);
      setAllowReview(true);
    }
    setErrorMsg(null);
  }, [examToEdit, isOpen]);

  const handleTimerModeChange = (mode: TimerMode) => {
    setTimerMode(mode);
    if (mode === 'question') {
      setDurationUnit('seconds');
      setDurationValue(60);
    } else if (mode === 'exam') {
      setDurationUnit('minutes');
      setDurationValue(30);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an examination title.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const calculatedDurationSeconds = timerMode === 'none'
      ? 0
      : timerMode === 'question' && durationUnit === 'seconds'
      ? Math.max(5, Number(durationValue))
      : Math.max(1, Number(durationValue)) * 60;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      class: studentClass,
      subject_id: subjectId || null,
      topic: topic.trim() || null,
      status,
      duration_seconds: calculatedDurationSeconds,
      timer_mode: timerMode,
      navigation_mode: navigationMode,
      total_marks: Number(totalMarks),
      passing_marks: Number(passingMarks),
      max_attempts: Number(maxAttempts),
      negative_marking_enabled: negativeMarking,
      show_results: showResults,
      allow_review: allowReview,
      instructions: instructions.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (examToEdit) {
        const { error } = await supabase
          .from('exams')
          .update(payload)
          .eq('id', examToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exams')
          .insert([payload]);
        if (error) throw error;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving exam:', err);
      setErrorMsg(err.message || 'Failed to save examination.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((s) => s.class === studentClass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {examToEdit ? 'Edit Examination' : 'Create New Examination'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure parameters, timers, and class eligibility
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Examination Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10th - Light Reflection & Refraction Weekly Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Class *
              </label>
              <select
                value={studentClass}
                onChange={(e) => {
                  setStudentClass(e.target.value as StudentClass);
                  setSubjectId('');
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              >
                <option value="6th">Class 6th</option>
                <option value="7th">Class 7th</option>
                <option value="8th">Class 8th</option>
                <option value="9th">Class 9th</option>
                <option value="10th">Class 10th</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExamStatus)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white font-medium"
              >
                <option value="draft">Draft (Hidden)</option>
                <option value="published">Published (Active)</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timer Mode *
              </label>
              <select
                value={timerMode}
                onChange={(e) => handleTimerModeChange(e.target.value as TimerMode)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white text-xs font-semibold"
              >
                <option value="exam">Mode 2: Whole Exam Timer</option>
                <option value="question">Mode 1: Per-Question Timer (Seconds & Minutes)</option>
                <option value="none">Mode 3: No Timer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Navigation Mode *
              </label>
              <select
                value={navigationMode}
                onChange={(e) => setNavigationMode(e.target.value as NavigationMode)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white text-xs font-semibold"
              >
                <option value="both">Mode 1: Previous + Next (Free Navigation)</option>
                <option value="next_only">Mode 2: Next Only (Locked on Forward)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topic / Unit
              </label>
              <input
                type="text"
                placeholder="e.g. Electricity, Photosynthesis"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {timerMode === 'question' 
                    ? 'Per-Question Time Limit *' 
                    : timerMode === 'none' 
                    ? 'Exam Timer' 
                    : 'Exam Duration *'}
                </label>
                {timerMode === 'question' && (
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        if (durationUnit !== 'seconds') {
                          setDurationUnit('seconds');
                          setDurationValue((prev) => (prev <= 10 ? prev * 60 : prev) || 60);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        durationUnit === 'seconds'
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Seconds (s)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (durationUnit !== 'minutes') {
                          setDurationUnit('minutes');
                          setDurationValue((prev) => Math.max(1, Math.round(prev / 60)) || 1);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        durationUnit === 'minutes'
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Minutes (m)
                    </button>
                  </div>
                )}
              </div>

              {timerMode === 'none' ? (
                <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-500 font-medium">
                  No timer restrictions active for this examination.
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={durationUnit === 'seconds' ? 5 : 1}
                      max={durationUnit === 'seconds' ? 600 : 300}
                      step={durationUnit === 'seconds' ? 5 : 1}
                      value={durationValue}
                      onChange={(e) => setDurationValue(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white font-mono"
                      placeholder={durationUnit === 'seconds' ? 'e.g. 45' : 'e.g. 30'}
                    />
                    <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                      {durationUnit === 'seconds' ? 'seconds' : 'minutes'}
                    </span>
                  </div>

                  {/* Quick Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                    {timerMode === 'question' ? (
                      durationUnit === 'seconds' ? (
                        [15, 30, 45, 60, 90, 120].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => {
                              setDurationUnit('seconds');
                              setDurationValue(sec);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                              durationUnit === 'seconds' && durationValue === sec
                                ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))
                      ) : (
                        [1, 2, 3, 5].map((min) => (
                          <button
                            key={min}
                            type="button"
                            onClick={() => {
                              setDurationUnit('minutes');
                              setDurationValue(min);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                              durationUnit === 'minutes' && durationValue === min
                                ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {min}m
                          </button>
                        ))
                      )
                    ) : (
                      [15, 30, 45, 60, 90].map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => {
                            setDurationUnit('minutes');
                            setDurationValue(min);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            durationUnit === 'minutes' && durationValue === min
                              ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {min}m
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Marks
              </label>
              <input
                type="number"
                min="1"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Passing Marks
              </label>
              <input
                type="number"
                min="0"
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Student Attempt Limit / Reattempt Configuration */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Student Attempt Policy (Reattempt Control) *
              </label>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                {maxAttempts === 1 ? '1 Attempt Only' : maxAttempts >= 100 ? 'Unlimited Reattempts' : `Up to ${maxAttempts} Attempts`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                maxAttempts === 1
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}>
                <input
                  type="radio"
                  name="attemptPolicy"
                  checked={maxAttempts === 1}
                  onChange={() => setMaxAttempts(1)}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Strict 1-Time Attempt
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Student can attempt only once. Cannot reattempt after submission.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                maxAttempts > 1
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}>
                <input
                  type="radio"
                  name="attemptPolicy"
                  checked={maxAttempts > 1}
                  onChange={() => setMaxAttempts(3)}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Allow Quiz Reattempt
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Student can retake the quiz to improve score and practice.
                  </span>
                </div>
              </label>
            </div>

            {maxAttempts > 1 && (
              <div className="mt-3 flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Allowed Reattempt Count:
                </span>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="2">2 Attempts Maximum</option>
                  <option value="3">3 Attempts Maximum</option>
                  <option value="5">5 Attempts Maximum</option>
                  <option value="10">10 Attempts Maximum</option>
                  <option value="999">Unlimited Reattempts</option>
                </select>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Negative Marking</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showResults}
                onChange={(e) => setShowResults(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Instant Result</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowReview}
                onChange={(e) => setAllowReview(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Allow Answer Review</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Examination Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : examToEdit ? 'Update Exam' : 'Create Exam'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
