// Vercel Serverless Function: Save / Update Web Push Subscription
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://thmpfhhqtplgiosjebwx.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobXBmaGhxdHBsZ2lvc2plYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDc4ODYsImV4cCI6MjEwOTc4Mzg4Nn0.oUvrLMFAkBd1KTqVlxWgrdniiK3cqpU91EGT6YI0XgQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Set CORS headers
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
    const { subscription, studentClass, userId } = req.body || {};

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid push subscription payload' });
    }

    const { endpoint, keys } = subscription;
    const userAgent = req.headers['user-agent'] || null;

    // Upsert subscription into Supabase push_subscriptions table
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        [
          {
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_id: userId || null,
            student_class: studentClass || 'all',
            user_agent: userAgent,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'endpoint' }
      )
      .select();

    if (error) {
      console.warn('Supabase push_subscriptions upsert notice:', error.message);
      // Return 200 with note so client flow doesn't break if table is still being created
      return res.status(200).json({
        success: true,
        saved: false,
        note: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      saved: true,
      data,
    });
  } catch (err) {
    console.error('Error handling push subscription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
