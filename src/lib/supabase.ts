import { createClient } from '@supabase/supabase-js';

export const RECOVERY_STORAGE_KEY = 'elite_password_recovery';

// Capture password recovery tokens immediately before Supabase client strips URL hash params
if (typeof window !== 'undefined') {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  if (!hash.includes('error=') && !search.includes('error=') && (hash.includes('type=recovery') || search.includes('type=recovery'))) {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, '1');
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://thmpfhhqtplgiosjebwx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobXBmaGhxdHBsZ2lvc2plYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDc4ODYsImV4cCI6MjEwOTc4Mzg4Nn0.oUvrLMFAkBd1KTqVlxWgrdniiK3cqpU91EGT6YI0XgQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Elite_Classes',
  creator: import.meta.env.VITE_APP_CREATOR || 'Vinay Prajapati',
  adminWhatsApp: import.meta.env.VITE_ADMIN_CONTACT_WHATSAPP || '8081788927',
};
