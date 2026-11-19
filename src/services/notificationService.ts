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

export const VAPID_PUBLIC_KEY = 
  import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  'BFJPifna1_cGRL797r4nGHMUZh5o45Z-yg1OaTAjFumUILCSSVNRTDWx7r_XTZjonpEROPv8SC_wvkv3YP8PCZg';

/**
 * Helper to convert Base64 URL string to Uint8Array for pushManager
 */
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register device for Background Web Push (Google FCM / W3C Push Service)
 */
export const registerDevicePushSubscription = async (
  studentClass: string = 'all',
  userId?: string | null
): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      return false;
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    if (subscription) {
      // Send subscription to backend serverless function
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          studentClass: studentClass || 'all',
          userId: userId || null,
        }),
      });
      return true;
    }
  } catch (err) {
    console.warn('Could not register Web Push subscription:', err);
  }
  return false;
};

/**
 * Request System Web Push Notification permission from the browser
 */
export const requestWebPushPermission = async (
  studentClass: string = 'all',
  userId?: string | null
): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // 1. Register device for background push
      await registerDevicePushSubscription(studentClass, userId);

      // 2. Local confirmation notification
      await triggerSystemWebPush(
        'System Push Notifications Enabled!',
        'You will now receive instant alerts on this device even when the app is closed.',
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
 * Send class notification via RPC (Teacher/Admin only) and dispatch Background Web Push
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
  // 1. Send via Supabase RPC for database history and realtime in-app listeners
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

  // 2. Dispatch Background Web Push to all registered offline/background smartphones
  let pushStats = { sent: 0, total: 0 };
  try {
    const pushRes = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetClass,
        title: title.trim(),
        message: message.trim(),
        notificationType,
        linkUrl: linkUrl ? linkUrl.trim() : '/dashboard',
      }),
    });

    if (pushRes.ok) {
      const pushJson = await pushRes.json();
      pushStats = { sent: pushJson.sent || 0, total: pushJson.total || 0 };
    }
  } catch (pushErr) {
    console.warn('Background Web Push dispatch warning:', pushErr);
  }

  // 3. Also trigger local push preview on sender's device
  await triggerSystemWebPush(
    `[Sent to Class ${targetClass === 'all' ? 'All' : targetClass}] ${title}`,
    message,
    linkUrl
  );

  return { rpcData: data, pushStats };
};
