// Vercel Serverless Function: Dispatch Background Web Push to Students
import * as webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://thmpfhhqtplgiosjebwx.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobXBmaGhxdHBsZ2lvc2plYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDc4ODYsImV4cCI6MjEwOTc4Mzg4Nn0.oUvrLMFAkBd1KTqVlxWgrdniiK3cqpU91EGT6YI0XgQ';

const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BFJPifna1_cGRL797r4nGHMUZh5o45Z-yg1OaTAjFumUILCSSVNRTDWx7r_XTZjonpEROPv8SC_wvkv3YP8PCZg';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'XkbcGIHWsSQkyQaYdqze6Pbt_GNcajyE584DG_W_T2w';

webpush.setVapidDetails(
  'mailto:gitwala.vinay@gmail.com',
  vapidPublicKey,
  vapidPrivateKey
);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { targetClass, title, message, linkUrl, notificationType } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // 1. Fetch push subscriptions from Supabase
    let query = supabase.from('push_subscriptions').select('*');

    if (targetClass && targetClass !== 'all') {
      // Send to target class or devices subscribed to 'all'
      query = query.or(`student_class.eq.${targetClass},student_class.eq.all`);
    }

    const { data: subscriptions, error: dbError } = await query;

    if (dbError) {
      console.warn('Could not query push_subscriptions table:', dbError.message);
      return res.status(200).json({
        success: true,
        sent: 0,
        total: 0,
        note: `Database subscription table notice: ${dbError.message}`,
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        sent: 0,
        total: 0,
        message: 'No registered push devices found for this class.',
      });
    }

    // 2. Prepare Web Push Payload
    const payload = JSON.stringify({
      title: title.startsWith('Elite') ? title : `Elite Classes: ${title}`,
      message: message,
      body: message,
      link_url: linkUrl || '/dashboard',
      notification_type: notificationType || 'exam',
      tag: `elite-${Date.now()}`,
      timestamp: Date.now(),
    });

    let sentCount = 0;
    let failedCount = 0;
    const expiredEndpoints = [];

    // 3. Dispatch pushes in parallel
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (err) {
          failedCount++;
          // If subscription has expired or unsubscribed, collect endpoint for cleanup
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          } else {
            console.warn('Web push delivery warning:', err.message);
          }
        }
      })
    );

    // 4. Clean up expired endpoints
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    return res.status(200).json({
      success: true,
      sent: sentCount,
      total: subscriptions.length,
      failed: failedCount,
      targetClass: targetClass || 'all',
    });
  } catch (err) {
    console.error('Error in send-push handler:', err);
    return res.status(500).json({ error: err.message || 'Push dispatch failed' });
  }
}
