import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Question, QuestionType, QuestionOption } from '../../types/database';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  examId: string;
  questionToEdit?: (Question & { options?: QuestionOption[]; answerKey?: string[] }) | null;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  examId,
  questionToEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [timeLimit, setTimeLimit] = useState(60);
  const [explanation, setExplanation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Options state
  const [options, setOptions] = useState<{ id?: string; text: string; isCorrect: boolean }[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  useEffect(() => {
    if (questionToEdit) {
      setQuestionText(questionToEdit.question_text);
      setQuestionType(questionToEdit.question_type);
      setMarks(questionToEdit.marks);
      setNegativeMarks(questionToEdit.negative_marks);
      setTimeLimit(questionToEdit.time_limit_seconds || 60);
      setExplanation(questionToEdit.explanation || '');
      setImageUrl(questionToEdit.image_url || '');

      if (questionToEdit.options && questionToEdit.options.length > 0) {
        setOptions(
          questionToEdit.options.map((opt) => ({
            id: opt.id,
            text: opt.option_text,
            isCorrect: questionToEdit.answerKey?.includes(opt.id) || false,
          }))
        );
      }
    } else {
      setQuestionText('');
      setQuestionType('single_choice');
      setMarks(1);
      setNegativeMarks(0);
      setTimeLimit(60);
      setExplanation('');
      setImageUrl('');
      setOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
    setErrorMsg(null);
  }, [questionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const handleCorrectToggle = (index: number) => {
    if (questionType === 'multiple_choice') {
      const updated = [...options];
      updated[index].isCorrect = !updated[index].isCorrect;
      setOptions(updated);
    } else {
      // Single choice or true/false: only one option is true
      const updated = options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === index,
      }));
      setOptions(updated);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    if (type === 'true_false') {
      setOptions([
        { text: 'True', isCorrect: true },
        { text: 'False', isCorrect: false },
      ]);
    } else if (options.length < 4) {
      setOptions([
        { text: options[0]?.text || '', isCorrect: true },
        { text: options[1]?.text || '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setErrorMsg('Please enter question text.');
      return;
    }

    const validOptions = options.filter((o) => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      setErrorMsg('Please provide at least 2 non-empty options.');
      return;
    }

    const hasCorrect = validOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      setErrorMsg('Please mark at least one correct option.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Insert or update question
      let qId = questionToEdit?.id;

      if (qId) {
        const { error: qErr } = await supabase
          .from('questions')
          .update({
            question_text: questionText.trim(),
            question_type: questionType,
            marks: Number(marks),
            negative_marks: Number(negativeMarks),
            time_limit_seconds: Number(timeLimit),
            explanation: explanation.trim() || null,
            image_url: imageUrl.trim() || null,
          })
          .eq('id', qId);
        if (qErr) throw qErr;

        // Delete existing options & recreate
        await supabase.from('question_options').delete().eq('question_id', qId);
      } else {
        const { data: newQ, error: qErr } = await supabase
          .from('questions')
          .insert([
            {
              exam_id: examId,
              question_text: questionText.trim(),
              question_type: questionType,
              marks: Number(marks),
              negative_marks: Number(negativeMarks),
              time_limit_seconds: Number(timeLimit),
              explanation: explanation.trim() || null,
              image_url: imageUrl.trim() || null,
              display_order: 99,
            },
          ])
          .select('id')
          .single();
        if (qErr) throw qErr;
        qId = newQ.id;
      }

      // 2. Insert options
      const correctOptionIds: string[] = [];

      for (let i = 0; i < validOptions.length; i++) {
        const opt = validOptions[i];
        const { data: optData, error: optErr } = await supabase
          .from('question_options')
          .insert([
            {
              question_id: qId,
              option_text: opt.text.trim(),
              display_order: i + 1,
            },
          ])
          .select('id')
          .single();

        if (optErr) throw optErr;

        if (opt.isCorrect && optData) {
          correctOptionIds.push(optData.id);
        }
      }

      // 3. Upsert answer key
      const { error: keyErr } = await supabase
        .from('answer_keys')
        .upsert(
          {
            question_id: qId,
            correct_option_ids: correctOptionIds,
          },
          { onConflict: 'question_id' }
        );

      if (keyErr) throw keyErr;

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving question:', err);
      setErrorMsg(err.message || 'Failed to save question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {questionToEdit ? 'Edit Question' : 'Add Question'}
            </h3>
            <p className="text-xs text-slate-500">
              Provide question prompt, marks, options, and correct answers
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
              Question Text *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Which of the following is an example of a chemical change?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={questionType}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marks (+)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Negative (-)
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timer (Sec)
              </label>
              <input
                type="number"
                min="10"
                max="600"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Diagram / Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/diagram.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Options List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Options & Correct Answer Selection *
              </label>
              {questionType !== 'true_false' && options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCorrectToggle(idx)}
                    className={`flex h-8 px-3 items-center justify-center rounded-xl text-xs font-bold transition-all shrink-0 ${
                      opt.isCorrect
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 hover:bg-slate-200'
                    }`}
                    title="Click to toggle as correct answer"
                  >
                    Option {String.fromCharCode(65 + idx)} {opt.isCorrect && '✓'}
                  </button>

                  <input
                    type="text"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
                  />

                  {questionType !== 'true_false' && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Explanation (Revealed during student review)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. In a chemical change, new substances with completely different chemical properties are formed."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
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
              <span>{loading ? 'Saving...' : questionToEdit ? 'Update Question' : 'Save Question'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
