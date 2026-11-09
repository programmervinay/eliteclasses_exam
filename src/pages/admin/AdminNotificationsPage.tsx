import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  MessageSquare, 
  Trash2, 
  RotateCcw,
  Volume2,
  Users,
  BookOpen,
  Award,
  AlertTriangle
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { supabase, APP_CONFIG } from '../../lib/supabase';
import { 
  sendClassNotification, 
  fetchMyNotifications, 
  triggerSystemWebPush, 
  requestWebPushPermission,
  playNotificationChime 
} from '../../services/notificationService';
import type { StudentClass, NotificationType, Exam, SystemNotification } from '../../types/database';

export const AdminNotificationsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [history, setHistory] = useState<SystemNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form states
  const [targetClass, setTargetClass] = useState<'all' | StudentClass>('10th');
  const [notificationType, setNotificationType] = useState<NotificationType>('exam');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('/dashboard');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing exams for auto-fill & notification history
  const loadData = async () => {
    try {
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      if (examData) setExams(examData);

      const notifs = await fetchMyNotifications();
      setHistory(notifs);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectExam = (examId: string) => {
    const selected = exams.find((e) => e.id === examId);
    if (selected) {
      setTargetClass(selected.class);
      setNotificationType('exam');
      setTitle(`📢 New Exam: ${selected.title}`);
      setMessage(
        `Dear Class ${selected.class} students, your exam "${selected.title}" is ready. Duration: ${Math.round(selected.duration_seconds / 60)}m, Total Marks: ${selected.total_marks}. Attempt it now on Elite_Classes!`
      );
      setLinkUrl(`/instructions/${selected.id}`);
    }
  };

  const applyTemplate = (type: 'exam' | 'reminder' | 'result') => {
    const classLabel = targetClass === 'all' ? 'All Classes (6th-10th)' : `Class ${targetClass}`;
    if (type === 'exam') {
      setTitle(`📢 New Examination Live for ${classLabel}`);
      setMessage(`Dear ${classLabel} students, a new examination has been published. Please log in to Elite_Classes to attempt it.`);
      setNotificationType('exam');
    } else if (type === 'reminder') {
      setTitle(`⏰ Exam Deadline Reminder - ${classLabel}`);
      setMessage(`Reminder for ${classLabel} students: The current examination session will end soon. Ensure your test is submitted on time.`);
      setNotificationType('reminder');
    } else if (type === 'result') {
      setTitle(`🏆 Results Published for ${classLabel}`);
      setMessage(`The results for the recent examination have been evaluated. Check your scorecard and full answer solutions in your dashboard.`);
      setNotificationType('result');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill out both the Title and Message body.' });
      return;
    }

    setSending(true);
    setStatusMsg(null);

    try {
      await sendClassNotification({
        targetClass,
        title,
        message,
        notificationType,
        linkUrl: linkUrl || null,
      });

      playNotificationChime();
      const targetName = targetClass === 'all' ? 'All Classes' : `Class ${targetClass}`;
      setStatusMsg({ 
        type: 'success', 
        text: `System Web Push Notification dispatched successfully to ${targetName} students!` 
      });

      // Reload history
      await loadData();

      // Reset form
      setTitle('');
      setMessage('');
      setLinkUrl('/dashboard');
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setHistory((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      alert('Could not delete notification: ' + e.message);
    }
  };

  const handleTestPush = async () => {
    const perm = await requestWebPushPermission();
    if (perm === 'granted') {
      triggerSystemWebPush(
        'Elite_Classes Test Push',
        'System push notifications are operating properly on this device!',
        '/admin/notifications'
      );
    } else {
      alert('Please allow notification permission in your browser URL bar to receive push alerts.');
    }
  };

  const whatsappBroadcastText = `*ELITE_CLASSES - NOTIFICATION*\nPowered by ${APP_CONFIG.creator}\n\n*${title || 'Announcement'}*\n\n${message}\n\n👉 *Login & Attempt here:* ${window.location.origin}${linkUrl || '/dashboard'}`;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'exam':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Exam Live</span>;
      case 'reminder':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Reminder</span>;
      case 'result':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Results</span>;
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Urgent</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">General</span>;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                System Web Push Center
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Send Notifications to Particular Class
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast native system push notifications and real-time dashboard alerts to students of any class
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestPush}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              title="Test push notification on this browser"
            >
              <Volume2 className="h-4 w-4 text-brand-600" />
              <span>Test Push on My Device</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`mb-6 flex items-center gap-2.5 rounded-2xl p-4 text-xs font-semibold border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
              : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border-red-200 dark:border-red-900'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Dispatcher Form (Left Column) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Radio className="h-5 w-5 text-brand-600 animate-pulse" />
                <span>Compose New Class Notification</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Targeted students will immediately receive a browser push notification with audio chime.
              </p>

              {/* Exam quick autofill */}
              {exams.length > 0 && (
                <div className="mb-5 p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50">
                  <label className="block text-[11px] font-bold text-brand-900 dark:text-brand-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                    <span>Quick Auto-Fill From Existing Examination:</span>
                  </label>
                  <select
                    onChange={(e) => handleSelectExam(e.target.value)}
                    defaultValue=""
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>Select an exam to auto-fill title, class, and direct link...</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        Class {ex.class} • {ex.title} ({ex.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="space-y-4">
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

                  {/* Category */}
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

                {/* Templates */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Quick Templates:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplate('exam')}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    + New Test Live
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('reminder')}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    + Deadline Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('result')}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    + Results Declared
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
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notification Message (Push Body) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write the message that will pop up on students' mobile phones and desktops..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Direct Action Link */}
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappBroadcastText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                    title="Broadcast this message to WhatsApp Class Group"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Share on WhatsApp Group</span>
                  </a>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 disabled:opacity-50 transition-all"
                  >
                    <Send className="h-4 w-4" />
                    <span>{sending ? 'Dispatching Push Alert...' : 'Broadcast System Push Notification'}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>

          {/* Sent Notifications Roster (Right Column) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Broadcast History
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {history.length} dispatched
                </span>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Notifications Sent Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the form on the left to broadcast to students.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {history.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                            {notif.target_class === 'all' ? 'All Classes' : `Class ${notif.target_class}`}
                          </span>
                          {getTypeBadge(notif.notification_type)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {new Date(notif.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {notif.link_url && (
                          <span className="text-brand-600 dark:text-brand-400 font-semibold truncate max-w-[120px]">
                            {notif.link_url}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
