import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare,
  Radio,
  ExternalLink
} from 'lucide-react';
import { sendClassNotification, playNotificationChime } from '../../services/notificationService';
import { APP_CONFIG } from '../../lib/supabase';
import type { StudentClass, NotificationType, Exam } from '../../types/database';

interface SendClassNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams?: Exam[];
  preselectedExam?: Exam | null;
}

export const SendClassNotificationModal: React.FC<SendClassNotificationModalProps> = ({
  isOpen,
  onClose,
  exams = [],
  preselectedExam = null,
}) => {
  const [targetClass, setTargetClass] = useState<'all' | StudentClass>(
    preselectedExam ? preselectedExam.class : '10th'
  );
  const [notificationType, setNotificationType] = useState<NotificationType>('exam');
  const [title, setTitle] = useState(
    preselectedExam ? `New Exam Live: ${preselectedExam.title}` : ''
  );
  const [message, setMessage] = useState(
    preselectedExam 
      ? `Dear Class ${preselectedExam.class} students, your exam "${preselectedExam.title}" is now available. Total Marks: ${preselectedExam.total_marks}. Please complete it on time!`
      : ''
  );
  const [linkUrl, setLinkUrl] = useState(
    preselectedExam ? `/instructions/${preselectedExam.id}` : '/dashboard'
  );
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectExam = (examId: string) => {
    const selected = exams.find((e) => e.id === examId);
    if (selected) {
      setTargetClass(selected.class);
      setNotificationType('exam');
      setTitle(`📢 New Exam Live: ${selected.title}`);
      setMessage(
        `Dear Class ${selected.class} students, your exam "${selected.title}" is live! Duration: ${Math.round(selected.duration_seconds / 60)} mins, Total Marks: ${selected.total_marks}. Attempt it now on Elite_Classes.`
      );
      setLinkUrl(`/instructions/${selected.id}`);
    }
  };

  const applyTemplate = (type: 'exam_live' | 'deadline' | 'result') => {
    const classLabel = targetClass === 'all' ? 'All Classes' : `Class ${targetClass}`;
    if (type === 'exam_live') {
      setTitle(`📢 New Examination Available!`);
      setMessage(`Attention ${classLabel} students: A new test has been published on Elite_Classes. Log in to your student dashboard to start.`);
      setNotificationType('exam');
    } else if (type === 'deadline') {
      setTitle(`⏰ Examination Reminder: Deadline Approaching`);
      setMessage(`Reminder for ${classLabel}: The pending examination window is closing soon. Ensure you submit your attempt today!`);
      setNotificationType('reminder');
    } else if (type === 'result') {
      setTitle(`🏆 Examination Results Declared!`);
      setMessage(`${classLabel} exam evaluation is completed. Check your score and answer explanations in your Elite_Classes dashboard.`);
      setNotificationType('result');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please enter both title and notification message.');
      return;
    }

    setSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await sendClassNotification({
        targetClass,
        title,
        message,
        notificationType,
        linkUrl: linkUrl || null,
      });

      playNotificationChime();
      const targetLabel = targetClass === 'all' ? 'All Classes (6th-10th)' : `Class ${targetClass}`;
      setSuccessMsg(`System Web Push Notification dispatched successfully to ${targetLabel}!`);
      
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to send class notification:', err);
      setErrorMsg(err.message || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  // WhatsApp broadcast text
  const whatsappBroadcastText = `*ELITE_CLASSES - NOTIFICATION*\nPowered by ${APP_CONFIG.creator}\n\n*${title || 'Announcement'}*\n\n${message}\n\n👉 *Login & Attempt here:* ${window.location.origin}${linkUrl || '/dashboard'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Send Class Notification
              </h3>
              <p className="text-xs text-slate-500">
                System Web Push & Instant Student Dashboard Alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          
          {/* Quick Exam Pre-fill dropdown if exams provided */}
          {exams.length > 0 && (
            <div className="p-3 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50">
              <label className="block text-[11px] font-bold text-brand-900 dark:text-brand-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span>Auto-Fill from Existing Examination:</span>
              </label>
              <select
                onChange={(e) => handleSelectExam(e.target.value)}
                defaultValue=""
                className="w-full rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="" disabled>Choose an exam to pre-populate...</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    Class {ex.class} • {ex.title} ({ex.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Particular Class *
              </label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 focus:border-brand-500 focus:outline-none"
              >
                <option value="10th">Class 10th Students</option>
                <option value="9th">Class 9th Students</option>
                <option value="8th">Class 8th Students</option>
                <option value="7th">Class 7th Students</option>
                <option value="6th">Class 6th Students</option>
                <option value="all">📢 All Classes (6th to 10th)</option>
              </select>
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Category *
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as NotificationType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
              >
                <option value="exam">📢 New Examination Live</option>
                <option value="reminder">⏰ Exam Deadline / Reminder</option>
                <option value="result">🏆 Results Published</option>
                <option value="urgent">🚨 Urgent Class Notice</option>
                <option value="general">💬 General Announcement</option>
              </select>
            </div>
          </div>

          {/* Quick template chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Quick Templates:</span>
            <button
              type="button"
              onClick={() => applyTemplate('exam_live')}
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              + New Test
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('deadline')}
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              + Reminder
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('result')}
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              + Result Out
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 📢 Class 10th - Science Reflection Quiz is Live!"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notification Message (Body) *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the message that will pop up on students' mobile phones and computers..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Action Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Direct Action Link (Optional)
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/dashboard or /instructions/<exam-id>"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* WhatsApp Class Group Share */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappBroadcastText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
              title="Share broadcast message to WhatsApp Class Group"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Share to WhatsApp Group</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 disabled:opacity-50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{sending ? 'Sending Push Alert...' : 'Send System Push Alert'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
