import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  examId: string;
}

interface ParsedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  error?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
  examId,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const csvContent =
      'question,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,explanation\n' +
      '"What is the chemical formula of Water?","H2O","CO2","NaCl","O2","A",1,0,"Water consists of 2 hydrogen atoms and 1 oxygen atom."\n' +
      '"Which organelle is the powerhouse of the cell?","Ribosome","Nucleus","Mitochondria","Endoplasmic Reticulum","C",1,0,"Mitochondria produce ATP cellular energy."\n' +
      '"Acceleration due to gravity on earth is approximately?","9.8 m/s²","8.9 m/s²","11.2 m/s²","5.4 m/s²","A",1,0,"Earth gravity standard is 9.8 m/s²."\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'elite_classes_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (content: string) => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    // Skip header line
    const dataRows = lines.slice(1);
    const parsed: ParsedQuestion[] = [];

    // Helper for simple CSV splitting with quotes
    const splitCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let inQuotes = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    dataRows.forEach((row, idx) => {
      const cols = splitCSVLine(row);
      if (cols.length < 6) return;

      const qText = cols[0]?.replace(/^"|"$/g, '').trim();
      const optA = cols[1]?.replace(/^"|"$/g, '').trim();
      const optB = cols[2]?.replace(/^"|"$/g, '').trim();
      const optC = cols[3]?.replace(/^"|"$/g, '').trim();
      const optD = cols[4]?.replace(/^"|"$/g, '').trim();
      const correct = cols[5]?.replace(/^"|"$/g, '').trim().toUpperCase();
      const marks = parseFloat(cols[6] || '1') || 1;
      const negMarks = parseFloat(cols[7] || '0') || 0;
      const explanation = cols[8]?.replace(/^"|"$/g, '').trim() || '';

      let error: string | undefined;
      if (!qText) error = 'Missing question text';
      else if (!optA || !optB) error = 'At least Option A and Option B required';
      else if (!['A', 'B', 'C', 'D'].includes(correct)) error = 'Correct answer must be A, B, C, or D';

      parsed.push({
        questionText: qText,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer: correct,
        marks,
        negativeMarks: negMarks,
        explanation,
        error,
      });
    });

    setParsedRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validQuestions = parsedRows.filter((r) => !r.error);
    if (validQuestions.length === 0) {
      setImportStatus('No valid questions to import.');
      return;
    }

    setLoading(true);
    setImportStatus(null);

    try {
      for (const q of validQuestions) {
        // 1. Insert question
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .insert([
            {
              exam_id: examId,
              question_text: q.questionText,
              question_type: 'single_choice',
              marks: q.marks,
              negative_marks: q.negativeMarks,
              explanation: q.explanation || null,
              display_order: 99,
            },
          ])
          .select('id')
          .single();

        if (qErr) throw qErr;

        // 2. Insert options
        const optionsToInsert = [
          { text: q.optionA, letter: 'A' },
          { text: q.optionB, letter: 'B' },
          ...(q.optionC ? [{ text: q.optionC, letter: 'C' }] : []),
          ...(q.optionD ? [{ text: q.optionD, letter: 'D' }] : []),
        ];

        let correctOptionId = '';

        for (let i = 0; i < optionsToInsert.length; i++) {
          const item = optionsToInsert[i];
          const { data: optData, error: optErr } = await supabase
            .from('question_options')
            .insert([
              {
                question_id: qData.id,
                option_text: item.text,
                display_order: i + 1,
              },
            ])
            .select('id')
            .single();

          if (optErr) throw optErr;

          if (item.letter === q.correctAnswer && optData) {
            correctOptionId = optData.id;
          }
        }

        // 3. Upsert answer key
        if (correctOptionId) {
          await supabase.from('answer_keys').insert([
            {
              question_id: qData.id,
              correct_option_ids: [correctOptionId],
            },
          ]);
        }
      }

      onImported();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setImportStatus(err.message || 'Failed to complete import.');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter((r) => !r.error).length;
  const invalidCount = parsedRows.filter((r) => r.error).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Bulk Import Questions
            </h3>
            <p className="text-xs text-slate-500">
              Upload a CSV file with questions, options, and answer keys
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template download banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 mb-5">
          <div className="text-xs">
            <span className="font-bold text-brand-900 dark:text-brand-200">Need the CSV format?</span>
            <p className="text-brand-700 dark:text-brand-400">Download the pre-formatted question template</p>
          </div>
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-200 shadow-sm hover:bg-brand-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download Sample
          </button>
        </div>

        {/* File input */}
        <div className="mb-5">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
            <Upload className="h-8 w-8 text-brand-500 mb-2" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Click to browse or drop CSV file here
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Supports .csv files</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200">
            <AlertCircle className="h-4 w-4" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Preview ({validCount} Valid, {invalidCount} Invalid)
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Question</th>
                    <th className="p-2">Correct</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className={row.error ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                      <td className="p-2 font-mono">{idx + 1}</td>
                      <td className="p-2 truncate max-w-xs">{row.questionText}</td>
                      <td className="p-2 font-bold">{row.correctAnswer}</td>
                      <td className="p-2">
                        {row.error ? (
                          <span className="text-red-600 font-semibold">{row.error}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || validCount === 0}
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : `Import ${validCount} Questions`}
          </button>
        </div>

      </div>
    </div>
  );
};
