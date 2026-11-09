import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Award, 
  CheckCircle, 
  MessageSquare,
  Lock,
  Smartphone
} from 'lucide-react';
import { APP_CONFIG } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const targetClasses = [
    { class: 'Class 6th', desc: 'Foundational concepts in Science, Maths & Social Science' },
    { class: 'Class 7th', desc: 'Core academic assessments with timed MCQs' },
    { class: 'Class 8th', desc: 'Preparation for higher secondary standards' },
    { class: 'Class 9th', desc: 'CBSE / State board syllabus mastery with negative marking' },
    { class: 'Class 10th', desc: 'Board exam simulation, comprehensive unit tests & revision' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-16 sm:py-24 border-b border-slate-200/60 dark:border-slate-800">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-400/10 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span>Official Examination Portal for Classes 6th to 10th</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Academic Excellence with{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              {APP_CONFIG.name}
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400">
            Powered by <span className="text-slate-800 dark:text-slate-200">{APP_CONFIG.creator}</span>
          </p>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A state-of-the-art online examination and assessment platform featuring timed tests, proctored anti-cheat monitoring, dynamic student watermarking, and instant WhatsApp scorecards.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all hover:scale-105"
              >
                <span>Go to {isAdmin ? 'Admin Portal' : 'Student Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all hover:scale-105"
                >
                  <span>Student Registration</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-7 py-3.5 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <span>Student / Teacher Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics Badge */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200/60 dark:border-slate-800/80">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">6th–10th</p>
              <p className="text-xs text-slate-500 mt-1">Dedicated Standard Classes</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">100% Free</p>
              <p className="text-xs text-slate-500 mt-1">Zero-Cost Infrastructure</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">Secure RLS</p>
              <p className="text-xs text-slate-500 mt-1">Hidden Answer Keys</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">WhatsApp</p>
              <p className="text-xs text-slate-500 mt-1">1-Click Teacher Sharing</p>
            </div>
          </div>

        </div>
      </section>

      {/* Classes Section */}
      <section id="classes" className="py-16 sm:py-20 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tailored Examinations by Grade
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Curated syllabus-aligned questions in Science, Mathematics, Social Studies, English, and Hindi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {targetClasses.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-6 flex flex-col justify-between hover:border-brand-500 hover:shadow-lg transition-all"
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs mb-3">
                    {item.class}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span>View Syllabus</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Engineered for Integrity & Precision
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why Elite_Classes Leads Online Assessment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Anti-Cheating Monitoring
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Detects fullscreen departures, tab switches, and focus loss using the Page Visibility API. Logs all events directly to teacher dashboards for impartial verification.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Fullscreen enforcement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Tab-switching logs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Dynamic student watermark
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mb-5">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Dynamic Timers & Modes
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Choose between Per-Question countdowns, Whole-Examination timers, or Deadline-based modes. Restrict backwards question navigation to simulate real entrance exam standards.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Per-question auto-save
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Next-only locked navigation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Server-side time sync
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 mb-5">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Instant WhatsApp Scorecard
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Students can immediately share their verified result card directly with Teacher Vinay Prajapati via WhatsApp (+91 8081788927) with a single click.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Instant percentage & pass/fail
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Pre-formatted WhatsApp text
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Secure answer key review
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Teacher Contact CTA */}
      <section className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-500/20">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-200">
                Direct Teacher Guidance
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Have questions or need batch admission?
              </h3>
              <p className="text-xs sm:text-sm text-brand-100 mt-2 max-w-xl">
                Contact Teacher Vinay Prajapati directly for course enrollments, examination schedules, or test feedback.
              </p>
            </div>
            <a
              href={`https://wa.me/91${APP_CONFIG.adminWhatsApp}?text=${encodeURIComponent('Hello Sir Vinay, I am interested in Elite_Classes batches.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-md hover:bg-slate-100 transition-all shrink-0"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp: 8081788927</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
