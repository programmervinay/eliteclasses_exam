import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ClipboardList, 
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  Trash2, 
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  Layers
} from 'lucide-react';
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
  imageUrl?: string;
  error?: string;
}

const SAMPLE_CSV = 
`question,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,explanation
"What is the chemical formula of Water?","H2O","CO2","NaCl","O2","A",1,0,"Water consists of 2 hydrogen atoms and 1 oxygen atom."
"Which organelle is known as the powerhouse of the cell?","Ribosome","Nucleus","Mitochondria","Endoplasmic Reticulum","C",1,0,"Mitochondria produce cellular energy in the form of ATP."
"What is the SI unit of electric current?","Volt","Ampere","Ohm","Watt","B",1,0,"Ampere is the SI base unit of electric current."
"Which gas do plants release during photosynthesis?","Carbon dioxide","Nitrogen","Oxygen","Hydrogen","C",1,0,"Oxygen is released as a byproduct during photosynthesis."`;

const CSV_HEADER = 'question,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,explanation';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
  examId,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [csvText, setCsvText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedQuestion[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setImportStatus(null);
      setImportProgress(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Split a CSV line respecting quotes and delimiter
  const splitLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Escaped quote "" -> "
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Robust parser for both CSV (comma) and TSV (tab from Excel/Sheets)
  const parseContent = (content: string) => {
    const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Determine delimiter: tab vs comma
    const hasTabs = rawLines.some((l) => l.includes('\t'));
    const delimiter = hasTabs ? '\t' : ',';

    // Detect if the first line is a header row
    const firstLineLower = rawLines[0].toLowerCase();
    const isHeader = 
      firstLineLower.includes('question') || 
      firstLineLower.includes('option') || 
      firstLineLower.includes('correct');

    const dataRows = isHeader ? rawLines.slice(1) : rawLines;
    const parsed: ParsedQuestion[] = [];

    dataRows.forEach((row, idx) => {
      const cols = splitLine(row, delimiter);
      if (cols.length < 2) return; // Skip completely malformed or empty rows

      const cleanCol = (val: string | undefined) => 
        (val || '').replace(/^["']|["']$/g, '').trim();

      const qText = cleanCol(cols[0]);
      const optA = cleanCol(cols[1]);
      const optB = cleanCol(cols[2]);
      const optC = cleanCol(cols[3]);
      const optD = cleanCol(cols[4]);
      
      // Clean and normalize correct answer (A, B, C, D or 1, 2, 3, 4)
      let rawCorrect = cleanCol(cols[5]).toUpperCase();
      rawCorrect = rawCorrect.replace(/^(OPTION|ANS|ANSWER|CHOICE)\s*/i, '').trim();
      if (rawCorrect === '1') rawCorrect = 'A';
      else if (rawCorrect === '2') rawCorrect = 'B';
      else if (rawCorrect === '3') rawCorrect = 'C';
      else if (rawCorrect === '4') rawCorrect = 'D';

      const marks = parseFloat(cleanCol(cols[6]) || '1') || 1;
      const negMarks = parseFloat(cleanCol(cols[7]) || '0') || 0;
      const explanation = cleanCol(cols[8]);
      const imageUrl = cleanCol(cols[9]) || undefined;

      // Validation
      let error: string | undefined;
      if (!qText) {
        error = 'Missing question text';
      } else if (!optA || !optB) {
        error = 'At least Option A and Option B are required';
      } else if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
        error = `Invalid answer "${cols[5] || ''}". Must be A, B, C, or D`;
      } else if (rawCorrect === 'C' && !optC) {
        error = 'Answer marked as C, but Option C is empty';
      } else if (rawCorrect === 'D' && !optD) {
        error = 'Answer marked as D, but Option D is empty';
      }

      parsed.push({
        questionText: qText,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer: rawCorrect,
        marks,
        negativeMarks: negMarks,
        explanation,
        imageUrl,
        error,
      });
    });

    setParsedRows(parsed);
  };

  // Textarea change handler
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    parseContent(text);
  };

  // Load sample questions
  const handleLoadSample = () => {
    setCsvText(SAMPLE_CSV);
    parseContent(SAMPLE_CSV);
    setImportStatus(null);
  };

  // Paste directly from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCsvText(text);
          parseContent(text);
          setImportStatus(null);
          return;
        }
      }
    } catch (err) {
      console.warn('Clipboard read error, focusing textarea for Ctrl+V:', err);
    }
    textareaRef.current?.focus();
  };

  // Copy CSV header format
  const handleCopyHeader = async () => {
    try {
      await navigator.clipboard.writeText(CSV_HEADER);
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
    } catch {
      // ignore fallback
    }
  };

  // Clear text and preview
  const handleClear = () => {
    setCsvText('');
    setSelectedFileName(null);
    setParsedRows([]);
    setImportStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download template as .csv file
  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'elite_classes_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseContent(text);
      setImportStatus(null);
    };
    reader.readAsText(file);
  };

  // Execute bulk import
  const handleImport = async () => {
    const validQuestions = parsedRows.filter((r) => !r.error);
    if (validQuestions.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No valid questions found to import. Please check validation errors above.',
      });
      return;
    }

    setLoading(true);
    setImportStatus(null);
    setImportProgress({ current: 0, total: validQuestions.length });

    try {
      // 1. Get current highest display_order for clean sequencing
      const { data: existingQ } = await supabase
        .from('questions')
        .select('display_order')
        .eq('exam_id', examId)
        .order('display_order', { ascending: false })
        .limit(1);

      let currentOrder = existingQ && existingQ.length > 0 ? (existingQ[0].display_order || 0) : 0;

      // 2. Insert questions sequentially with batch options
      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];
        currentOrder += 1;
        setImportProgress({ current: i + 1, total: validQuestions.length });

        // Insert question record
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .insert([
            {
              exam_id: examId,
              question_text: q.questionText,
              question_type: 'single_choice',
              image_url: q.imageUrl || null,
              marks: q.marks,
              negative_marks: q.negativeMarks,
              explanation: q.explanation || null,
              display_order: currentOrder,
            },
          ])
          .select('id')
          .single();

        if (qErr) throw qErr;

        // Batch insert options
        const optionsPayload = [
          { question_id: qData.id, option_text: q.optionA, display_order: 1 },
          { question_id: qData.id, option_text: q.optionB, display_order: 2 },
          ...(q.optionC ? [{ question_id: qData.id, option_text: q.optionC, display_order: 3 }] : []),
          ...(q.optionD ? [{ question_id: qData.id, option_text: q.optionD, display_order: 4 }] : []),
        ];

        const { data: insertedOpts, error: optErr } = await supabase
          .from('question_options')
          .insert(optionsPayload)
          .select('id, display_order');

        if (optErr) throw optErr;

        // Insert answer key based on letter -> display_order mapping
        const letterToOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
        const targetOrder = letterToOrder[q.correctAnswer] || 1;
        const matchingOpt = insertedOpts?.find((opt) => opt.display_order === targetOrder);

        if (matchingOpt) {
          const { error: keyErr } = await supabase.from('answer_keys').insert([
            {
              question_id: qData.id,
              correct_option_ids: [matchingOpt.id],
            },
          ]);
          if (keyErr) throw keyErr;
        }
      }

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${validQuestions.length} questions into the examination!`,
      });

      // Notify parent to refresh question list and close
      setTimeout(() => {
        onImported();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Import error:', err);
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to complete import. Please check data format.',
      });
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter((r) => !r.error).length;
  const invalidCount = parsedRows.filter((r) => r.error).length;

  const displayedRows = parsedRows.filter((r) => {
    if (previewFilter === 'valid') return !r.error;
    if (previewFilter === 'invalid') return !!r.error;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Bulk Import Questions
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add multiple questions at once by directly pasting formatted CSV text or uploading a CSV file.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Direct Paste CSV / Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Upload CSV File</span>
            </button>
          </div>

          {/* Quick template actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyHeader}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              title="Copy CSV column headers to clipboard"
            >
              {copiedHeader ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedHeader ? 'Headers Copied!' : 'Copy Headers'}</span>
            </button>

            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-[11px] font-bold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors shadow-sm"
              title="Download pre-formatted sample CSV file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Sample CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">

          {/* TAB 1: Direct Paste */}
          {activeTab === 'paste' && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Paste CSV or Spreadsheet Data</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    (Supports Comma-separated & Tab-separated from Excel / Google Sheets)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    title="Paste text from clipboard"
                  >
                    <ClipboardList className="h-3 w-3" />
                    <span>Paste Clipboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                    title="Insert 4 sample questions to test"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Load Sample</span>
                  </button>

                  {csvText && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600"
                      title="Clear textarea"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={csvText}
                  onChange={handleTextChange}
                  rows={7}
                  placeholder={`Paste CSV rows here. Headers are optional.\n\nFormat: question,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,explanation\n\nExample:\n"What is the chemical formula of Water?","H2O","CO2","NaCl","O2","A",1,0,"Water is H2O"\n"Acceleration due to gravity on earth is?","9.8 m/s²","8.9 m/s²","11.2 m/s²","5.4 m/s²","A",1,0,"Standard is 9.8"`}
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all resize-y"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>
                    Columns: Question • Opt A • Opt B • Opt C • Opt D • Answer (A/B/C/D) • Marks • Neg Marks • Explanation
                  </span>
                  <span>
                    {csvText.split(/\r?\n/).filter((l) => l.trim()).length} lines • {csvText.length} chars
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upload File */}
          {activeTab === 'upload' && (
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 sm:p-8 cursor-pointer hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-slate-800/40 transition-all text-center">
                <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mb-2">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedFileName ? selectedFileName : 'Click to browse or drop CSV file here'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supports standard comma-separated .csv files
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {selectedFileName && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="truncate">File loaded: <strong>{selectedFileName}</strong></span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-red-500 hover:text-red-700 font-semibold shrink-0 ml-2"
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status Alert Banner */}
          {importStatus && (
            <div
              className={`flex items-center gap-2 rounded-2xl p-3.5 text-xs border ${
                importStatus.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {importStatus.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span className="font-semibold">{importStatus.message}</span>
            </div>
          )}

          {/* Import Progress Bar */}
          {loading && importProgress && (
            <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
              <div className="flex items-center justify-between text-xs font-bold text-brand-900 dark:text-brand-200 mb-1.5">
                <span>Importing questions into examination...</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-brand-200 dark:bg-brand-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Live Parsed Preview Section */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
              
              {/* Preview Header & Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Questions Preview ({parsedRows.length} Total)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    {validCount} Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-3 w-3" />
                      {invalidCount} Needs Fix
                    </span>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      previewFilter === 'all'
                        ? 'bg-brand-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      previewFilter === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Valid Only ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('invalid')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        previewFilter === 'invalid'
                          ? 'bg-red-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Errors Only ({invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">Question Text</th>
                      <th className="p-2.5">Options Preview</th>
                      <th className="p-2.5 text-center w-14">Ans</th>
                      <th className="p-2.5 text-center w-16">Marks</th>
                      <th className="p-2.5 w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedRows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={row.error ? 'bg-red-50/60 dark:bg-red-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                      >
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate" title={row.questionText}>
                          {row.questionText || <span className="text-red-500 italic">Empty question</span>}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">A:</span> {row.optionA.slice(0, 15) || '—'} •{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">B:</span> {row.optionB.slice(0, 15) || '—'}
                          {row.optionC && ` • C: ${row.optionC.slice(0, 12)}`}
                          {row.optionD && ` • D: ${row.optionD.slice(0, 12)}`}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-md font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700">
                            {row.correctAnswer || '?'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          +{row.marks} / -{row.negativeMarks}
                        </td>
                        <td className="p-2.5">
                          {row.error ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400" title={row.error}>
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{row.error}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span>Ready</span>
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

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 shrink-0">
          <div className="text-xs text-slate-500">
            {validCount > 0 ? (
              <span>Ready to add <strong className="text-brand-600 dark:text-brand-400 font-bold">{validCount} questions</strong> to this exam.</span>
            ) : (
              <span>Paste or upload questions above to begin.</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={loading || validCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <Upload className="h-4 w-4" />
              <span>
                {loading 
                  ? 'Importing Questions...' 
                  : `Import ${validCount > 0 ? `${validCount} ` : ''}Questions`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
