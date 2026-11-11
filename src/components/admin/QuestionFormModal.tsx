import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  ImagePlus,
  Link2,
  Loader2,
  Upload,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadQuestionImage } from '../../utils/imageUpload';
import type { Question, QuestionType, QuestionOption } from '../../types/database';

interface OptionDraft {
  id?: string;
  text: string;
  imageUrl: string;
  isCorrect: boolean;
}

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

  const [uploadingQuestionImg, setUploadingQuestionImg] = useState(false);
  const [uploadingOptionIdx, setUploadingOptionIdx] = useState<number | null>(null);
  const [showOptionUrlIdx, setShowOptionUrlIdx] = useState<Record<number, boolean>>({});

  const questionFileInputRef = useRef<HTMLInputElement | null>(null);
  const optionFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Options state
  const [options, setOptions] = useState<OptionDraft[]>([
    { text: '', imageUrl: '', isCorrect: true },
    { text: '', imageUrl: '', isCorrect: false },
    { text: '', imageUrl: '', isCorrect: false },
    { text: '', imageUrl: '', isCorrect: false },
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
            imageUrl: opt.image_url || '',
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
        { text: '', imageUrl: '', isCorrect: true },
        { text: '', imageUrl: '', isCorrect: false },
        { text: '', imageUrl: '', isCorrect: false },
        { text: '', imageUrl: '', isCorrect: false },
      ]);
    }
    setErrorMsg(null);
    setShowOptionUrlIdx({});
  }, [questionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    setOptions(updated);
  };

  const handleOptionImageUrlChange = (index: number, url: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], imageUrl: url };
    setOptions(updated);
  };

  const handleQuestionImageUpload = async (file: File) => {
    setErrorMsg(null);
    setUploadingQuestionImg(true);
    try {
      const uploadedUrl = await uploadQuestionImage(file, 'questions');
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to attach question image.');
    } finally {
      setUploadingQuestionImg(false);
    }
  };

  const handleOptionImageUpload = async (index: number, file: File) => {
    setErrorMsg(null);
    setUploadingOptionIdx(index);
    try {
      const uploadedUrl = await uploadQuestionImage(file, 'options');
      handleOptionImageUrlChange(index, uploadedUrl);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to attach image for Option ${String.fromCharCode(65 + index)}.`);
    } finally {
      setUploadingOptionIdx(null);
    }
  };

  const extractClipboardImageFile = (e: React.ClipboardEvent): File | null => {
    const items = e.clipboardData?.items;
    if (!items) return null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        return items[i].getAsFile();
      }
    }
    return null;
  };

  const handleCorrectToggle = (index: number) => {
    if (questionType === 'multiple_choice') {
      const updated = [...options];
      updated[index] = { ...updated[index], isCorrect: !updated[index].isCorrect };
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
      setOptions([...options, { text: '', imageUrl: '', isCorrect: false }]);
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
        { text: 'True', imageUrl: '', isCorrect: true },
        { text: 'False', imageUrl: '', isCorrect: false },
      ]);
    } else if (options.length < 4) {
      setOptions([
        { text: options[0]?.text || '', imageUrl: options[0]?.imageUrl || '', isCorrect: true },
        { text: options[1]?.text || '', imageUrl: options[1]?.imageUrl || '', isCorrect: false },
        { text: '', imageUrl: '', isCorrect: false },
        { text: '', imageUrl: '', isCorrect: false },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() && !imageUrl.trim()) {
      setErrorMsg('Please enter question text or attach a question image.');
      return;
    }

    const validOptions = options.filter(
      (o) => o.text.trim().length > 0 || o.imageUrl.trim().length > 0
    );
    if (validOptions.length < 2) {
      setErrorMsg('Please provide at least 2 options (text or image).');
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

      // 2. Insert options (supporting both text and image attachments)
      const correctOptionIds: string[] = [];

      for (let i = 0; i < validOptions.length; i++) {
        const opt = validOptions[i];
        const { data: optData, error: optErr } = await supabase
          .from('question_options')
          .insert([
            {
              question_id: qId,
              option_text: opt.text.trim(),
              image_url: opt.imageUrl.trim() || null,
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
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {questionToEdit ? 'Edit Question' : 'Add Question'}
            </h3>
            <p className="text-xs text-slate-500">
              Add text or image-based questions, attach diagrams to questions &amp; options
            </p>
          </div>
          <button
            type="button"
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
          {/* Question Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Question Text {imageUrl ? '(Optional when image attached)' : '*'}
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Identify the ray diagram shown below (you can also paste a screenshot directly)..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onPaste={(e) => {
                const file = extractClipboardImageFile(e);
                if (file) {
                  e.preventDefault();
                  handleQuestionImageUpload(file);
                }
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Question Image Attachment */}
          <div
            className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3.5"
            onPaste={(e) => {
              const file = extractClipboardImageFile(e);
              if (file) {
                e.preventDefault();
                handleQuestionImageUpload(file);
              }
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImagePlus className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Question Image / Diagram (Optional)
              </span>

              <div className="flex items-center gap-2">
                <input
                  ref={questionFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleQuestionImageUpload(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingQuestionImg}
                  onClick={() => questionFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {uploadingQuestionImg ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>{imageUrl ? 'Replace Image' : 'Attach Image'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Or paste an image URL (https://...) or Ctrl+V screenshot"
              value={imageUrl.startsWith('data:') ? 'Embedded Compressed Image Attached' : imageUrl}
              readOnly={imageUrl.startsWith('data:')}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
            />

            {imageUrl && (
              <div className="mt-3 relative inline-block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5">
                <img
                  src={imageUrl}
                  alt="Question Preview"
                  className="max-h-40 w-auto rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                  title="Remove Question Image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* Options List (Text + Image per option) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Options (Text and/or Image) &amp; Correct Answer *
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

            <div className="space-y-3">
              {options.map((opt, idx) => {
                const optionLetter = String.fromCharCode(65 + idx);
                const isUploadingOpt = uploadingOptionIdx === idx;
                const isUrlOpen = showOptionUrlIdx[idx] || false;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 space-y-2"
                    onPaste={(e) => {
                      const file = extractClipboardImageFile(e);
                      if (file) {
                        e.preventDefault();
                        handleOptionImageUpload(idx, file);
                      }
                    }}
                  >
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCorrectToggle(idx)}
                        className={`flex h-8 px-2.5 items-center justify-center rounded-xl text-xs font-bold transition-all shrink-0 ${
                          opt.isCorrect
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                        title="Click to toggle as correct answer"
                      >
                        Option {optionLetter} {opt.isCorrect && '✓'}
                      </button>

                      <input
                        type="text"
                        placeholder={`Option ${optionLetter} text (or attach image)`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 min-w-[140px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
                      />

                      <input
                        ref={(el) => {
                          optionFileInputRefs.current[idx] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleOptionImageUpload(idx, file);
                          e.target.value = '';
                        }}
                      />

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isUploadingOpt}
                          onClick={() => optionFileInputRefs.current[idx]?.click()}
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-all ${
                            opt.imageUrl
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-400'
                          }`}
                          title={`Attach image to Option ${optionLetter}`}
                        >
                          {isUploadingOpt ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {isUploadingOpt ? '...' : 'Image'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShowOptionUrlIdx((prev) => ({ ...prev, [idx]: !prev[idx] }))
                          }
                          className={`p-1.5 rounded-xl border text-xs transition-all ${
                            isUrlOpen
                              ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                          title="Paste option image URL"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </button>

                        {questionType !== 'true_false' && options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                            title="Remove option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isUrlOpen && (
                      <input
                        type="url"
                        placeholder={`Option ${optionLetter} image URL (https://...)`}
                        value={opt.imageUrl.startsWith('data:') ? '' : opt.imageUrl}
                        onChange={(e) => handleOptionImageUrlChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:text-white"
                      />
                    )}

                    {opt.imageUrl && (
                      <div className="relative inline-block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                        <img
                          src={opt.imageUrl}
                          alt={`Option ${optionLetter} Preview`}
                          className="max-h-24 w-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleOptionImageUrlChange(idx, '')}
                          className="absolute -top-2 -right-2 rounded-full bg-red-600 p-0.5 text-white shadow hover:bg-red-700"
                          title={`Remove Option ${optionLetter} Image`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
              disabled={loading || uploadingQuestionImg || uploadingOptionIdx !== null}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingQuestionImg || uploadingOptionIdx !== null}
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
