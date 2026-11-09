import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  AlertTriangle, 
  Maximize2, 
  Copy, 
  Clock, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { SuspiciousEvent, Exam } from '../../types/database';

export const AdminSuspiciousPage: React.FC = () => {
  const [events, setEvents] = useState<SuspiciousEvent[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSuspiciousEvents = async () => {
      setLoading(true);
      try {
        const { data: exData } = await supabase.from('exams').select('*').order('title');
        if (exData) setExams(exData as Exam[]);

        const { data, error } = await supabase
          .from('suspicious_events')
          .select('*, student:profiles(*), exam:exams(*)')
          .order('occurred_at', { ascending: false });

        if (error) throw error;
        setEvents((data || []) as SuspiciousEvent[]);
      } catch (err) {
        console.error('Error fetching suspicious events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuspiciousEvents();
  }, []);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'tab_switch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Tab Switch
          </span>
        );
      case 'fullscreen_exit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            <Maximize2 className="h-3 w-3" /> Fullscreen Exit
          </span>
        );
      case 'copy_attempt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <Copy className="h-3 w-3" /> Copy Shortcut
          </span>
        );
      case 'context_menu':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Right Click
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  // Group events by Attempt/Student to compute student-level summary
  const studentAttemptSummary: Record<string, { student: any; exam: any; total: number; tabSwitches: number; fullscreenExits: number; latest: string }> = {};

  events.forEach((evt) => {
    const key = `${evt.student_id}_${evt.exam_id}`;
    if (!studentAttemptSummary[key]) {
      studentAttemptSummary[key] = {
        student: evt.student,
        exam: evt.exam,
        total: 0,
        tabSwitches: 0,
        fullscreenExits: 0,
        latest: evt.occurred_at,
      };
    }
    studentAttemptSummary[key].total += 1;
    if (evt.event_type === 'tab_switch') studentAttemptSummary[key].tabSwitches += 1;
    if (evt.event_type === 'fullscreen_exit') studentAttemptSummary[key].fullscreenExits += 1;
  });

  const getAdvisoryTag = (total: number) => {
    if (total === 0) {
      return <span className="text-emerald-600 font-semibold">No recorded interruptions</span>;
    }
    if (total <= 2) {
      return <span className="text-amber-600 font-semibold">Minor interruptions (1–2)</span>;
    }
    if (total <= 5) {
      return <span className="text-orange-600 font-bold">Multiple interruptions (3–5)</span>;
    }
    return <span className="text-red-600 font-bold">Requires teacher review (6+)</span>;
  };

  const filteredEvents = events.filter((e) => {
    if (selectedExamId !== 'all' && e.exam_id !== selectedExamId) return false;
    if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.student?.full_name?.toLowerCase().includes(q);
      const matchExam = e.exam?.title?.toLowerCase().includes(q);
      return matchName || matchExam;
    }

    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Anti-Cheat Monitoring & Interruption Log
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Objective browser event records (fullscreen exits, tab switches, and shortcuts). Note: Browser interruptions do not guarantee cheating; use teacher discretion.
          </p>
        </div>

        {/* Realistic Advisory Banner */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 text-xs text-blue-900 dark:text-blue-200 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Teacher Advisory:</strong> Technical glitches, operating system popups, or accidental touchpad swipes can cause focus loss. Use these timestamps alongside student exam speed and difficulty to assess integrity fairly.
          </div>
        </div>

        {/* Student Session Summary Cards */}
        {Object.keys(studentAttemptSummary).length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm mb-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Session Interruption Summaries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(studentAttemptSummary).map(([key, item]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.student?.full_name || 'Student'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Class {item.student?.class}
                    </span>
                  </div>
                  <p className="text-slate-500 truncate mb-2">{item.exam?.title}</p>
                  
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span>Total Events: <strong>{item.total}</strong></span>
                    <div>{getAdvisoryTag(item.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-1.5 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-xs truncate"
          >
            <option value="all">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Class {ex.class} - {ex.title}
              </option>
            ))}
          </select>

          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Event Types</option>
            <option value="tab_switch">Tab Switch</option>
            <option value="fullscreen_exit">Fullscreen Exit</option>
            <option value="window_blur">Window Blur</option>
            <option value="copy_attempt">Copy Attempt</option>
            <option value="context_menu">Context Menu</option>
          </select>
        </div>

        {/* Detailed Event Timeline Table */}
        {loading ? (
          <LoadingSpinner message="Loading monitoring records..." />
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Clean Examination Records</h3>
            <p className="mt-1 text-xs text-slate-500">No suspicious events or interruptions recorded for the selected filter.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Time</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Examination</th>
                    <th className="p-4">Event Recorded</th>
                    <th className="p-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-mono text-slate-500">
                        {new Date(evt.occurred_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {evt.student?.full_name || 'Student'}
                      </td>
                      <td className="p-4 text-slate-500">
                        Class {evt.student?.class}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {evt.exam?.title}
                      </td>
                      <td className="p-4">
                        {getEventBadge(evt.event_type)}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {JSON.stringify(evt.event_metadata || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
