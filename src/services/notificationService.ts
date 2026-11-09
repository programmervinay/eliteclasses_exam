import { supabase } from '../lib/supabase';
import type { StudentClass, SystemNotification, NotificationType } from '../types/database';

/**
 * Web Audio chime for incoming notification sound (no external mp3 dependency)
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant two-tone chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.debug('Audio chime could not play:', err);
  }
};

/**
 * Trigger native browser System Web Push Notification
 * Fully supports Smartphone Mobile Chrome (Android via Service Worker) and Desktop
 */
export const triggerSystemWebPush = async (
  title: string,
  body: string,
  linkUrl?: string | null
) => {
  // 1. Play sound
  playNotificationChime();

  // 2. Vibrate smartphone if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // ignore
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    // 3. Preferred approach for Smartphones (Android Chrome enforces ServiceWorkerRegistration.showNotification)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(`Elite_Classes: ${title}`, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200],
            tag: `elite-${Date.now()}`,
            data: {
              url: linkUrl || '/dashboard',
            },
          } as any);
          return;
        }
      } catch (swError) {
        console.warn('Smartphone service worker push error, falling back to window.Notification:', swError);
      }
    }

    // 4. Desktop browser fallback
    try {
      const notif = new Notification(`Elite_Classes: ${title}`, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `elite-${Date.now()}`,
      });

      notif.onclick = () => {
        window.focus();
        if (linkUrl) {
          window.location.href = linkUrl;
        }
        notif.close();
      };
    } catch (e) {
      console.warn('Native push notification error:', e);
    }
  }
};

/**
 * Request System Web Push Notification permission from the browser
 */
export const requestWebPushPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await triggerSystemWebPush(
        'System Push Notifications Enabled!',
        'You will now receive instant alerts on this device for upcoming exams and results.',
        '/dashboard'
      );
    }
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
};

/**
 * Fetch notifications for currently logged in student or teacher via RPC
 */
export const fetchMyNotifications = async (): Promise<SystemNotification[]> => {
  try {
    const { data, error } = await supabase.rpc('get_student_notifications');
    if (error) {
      console.error('Error fetching notifications via RPC:', error);
      return [];
    }
    return (data || []) as SystemNotification[];
  } catch (err) {
    console.error('Exception fetching notifications:', err);
    return [];
  }
};

/**
 * Send class notification via RPC (Teacher/Admin only)
 */
export const sendClassNotification = async ({
  targetClass,
  title,
  message,
  notificationType = 'exam',
  linkUrl = null,
}: {
  targetClass: 'all' | StudentClass;
  title: string;
  message: string;
  notificationType?: NotificationType;
  linkUrl?: string | null;
}) => {
  const { data, error } = await supabase.rpc('send_class_notification', {
    p_target_class: targetClass,
    p_title: title.trim(),
    p_message: message.trim(),
    p_type: notificationType,
    p_link_url: linkUrl ? linkUrl.trim() : null,
  });

  if (error) {
    throw error;
  }

  // Also trigger local push preview on sender's device
  await triggerSystemWebPush(
    `[Sent to Class ${targetClass === 'all' ? 'All' : targetClass}] ${title}`,
    message,
    linkUrl
  );

  return data;
};
