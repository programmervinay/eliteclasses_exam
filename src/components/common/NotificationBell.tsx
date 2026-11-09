import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  Sparkles, 
  Volume2, 
  Clock, 
  Radio, 
  AlertTriangle,
  Award,
  BookOpen,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  fetchMyNotifications, 
  triggerSystemWebPush, 
  requestWebPushPermission,
  playNotificationChime
} from '../../services/notificationService';
import type { SystemNotification } from '../../types/database';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load initial notifications
  const loadNotifications = async () => {
    if (!user) return;
    const list = await fetchMyNotifications();
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.is_read).length);
  };

  useEffect(() => {
    loadNotifications();

    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  // Subscribe to Supabase Realtime for instant push delivery
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('system_notifications_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as any;
          const myClass = profile?.class;

          // Check relevance: admin sees all; student sees their class or 'all'
          const isRelevant =
            isAdmin ||
            newNotif.target_class === 'all' ||
            newNotif.target_class === myClass ||
            newNotif.user_id === user.id;

          if (isRelevant) {
            playNotificationChime();
            triggerSystemWebPush(newNotif.title, newNotif.message, newNotif.link_url);

            const item: SystemNotification = {
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              notification_type: newNotif.notification_type || 'exam',
              target_class: newNotif.target_class || 'all',
              link_url: newNotif.link_url,
              is_read: false,
              created_at: newNotif.created_at || new Date().toISOString(),
            };

            setNotifications((prev) => [item, ...prev]);
            setUnreadCount((c) => c + 1);

            // Pop up mobile & desktop in-app alert banner
            setActiveToast(item);
            setTimeout(() => {
              setActiveToast((current) => (current?.id === item.id ? null : current));
            }, 8000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, isAdmin]);

  const handleEnablePush = async () => {
    const res = await requestWebPushPermission();
    setPushPermission(res);
  };

  const markAllAsRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.debug('Error marking as read:', e);
    }
  };

  const handleItemClick = (notif: SystemNotification) => {
    setIsOpen(false);
    if (notif.link_url) {
      if (notif.link_url.startsWith('http')) {
        window.open(notif.link_url, '_blank');
      } else {
        navigate(notif.link_url);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      case 'reminder':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'result':
        return <Award className="h-4 w-4 text-emerald-500" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      default:
        return <Radio className="h-4 w-4 text-indigo-500" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        title="Class Notifications & System Web Push"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Class Notifications
              </span>
              {profile?.class && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Class {profile.class}
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Web Push Permission Banner if not yet granted */}
          {pushPermission !== 'granted' && (
            <div className="p-3 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/50 dark:to-indigo-950/50 border-b border-brand-100 dark:border-brand-900/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-brand-900 dark:text-brand-300">
                <Volume2 className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="text-[11px] font-medium leading-tight">
                  Enable System Push to get alerts even when tab is closed.
                </span>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-brand-600 text-white text-[11px] font-bold shadow-sm hover:bg-brand-700"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Notifications Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Exam announcements and alerts from Teacher Vinay will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    !notif.is_read ? 'bg-brand-50/20 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getTypeIcon(notif.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {notif.target_class === 'all' ? 'All' : `Cls ${notif.target_class}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.link_url && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                          <span>Open Exam</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 text-center text-[10px] font-medium text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            Realtime System Push Notifications • Elite_Classes
          </div>

        </div>
      )}

      {/* Realtime In-App Floating Push Alert Banner (Optimized for Smartphones & Desktop) */}
      {activeToast && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-3xl bg-slate-900 text-white shadow-2xl border border-brand-500/80 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  {activeToast.target_class === 'all' ? 'All Classes' : `Class ${activeToast.target_class}`} Alert
                </span>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h4 className="text-xs font-black truncate">{activeToast.title}</h4>
              <p className="mt-0.5 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                {activeToast.message}
              </p>
              {activeToast.link_url && (
                <button
                  type="button"
                  onClick={() => handleItemClick(activeToast)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-500 transition-colors"
                >
                  <span>Open Now</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
