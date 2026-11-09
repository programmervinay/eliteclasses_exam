import React from 'react';
import { GraduationCap, Heart, MessageSquare, Phone, Shield } from 'lucide-react';
import { APP_CONFIG } from '../../lib/supabase';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-slate-600 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {APP_CONFIG.name}
              </p>
              <p className="text-xs text-slate-500">
                Powered by <span className="font-semibold text-brand-600 dark:text-brand-400">{APP_CONFIG.creator}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              Class 6th to 10th Standard
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              Proctored & Watermarked
            </span>
            <a
              href={`https://wa.me/91${APP_CONFIG.adminWhatsApp}?text=${encodeURIComponent('Hello Sir Vinay, I have a query regarding Elite_Classes.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <div className="text-xs text-center md:text-right">
            <p>© {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Designed with care for high school academic excellence.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
