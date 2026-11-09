import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || (isAdmin ? '/admin' : '/dashboard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await login(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Invalid email or password. Please try again.');
    } else {
      if (email.trim().toLowerCase() === 'gitwala.vinay@gmail.com') {
        navigate('/admin');
      } else {
        navigate(from || '/dashboard');
      }
    }
  };

  const handleFillTeacherCredentials = () => {
    setEmail('gitwala.vinay@gmail.com');
    setPassword('karvin123');
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
        
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25 mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Sign In to {APP_CONFIG.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Powered by {APP_CONFIG.creator} • Examination Portal
          </p>
        </div>

        {/* Pre-Configured Teacher Login Card */}
        <div className="mb-6 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span>Teacher / Admin Pre-configured</span>
            </div>
            <button
              type="button"
              onClick={handleFillTeacherCredentials}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-sm transition-all"
            >
              <Sparkles className="h-3 w-3" />
              <span>Auto-Fill</span>
            </button>
          </div>
          <div className="text-[11px] font-mono text-purple-800 dark:text-purple-300 space-y-0.5">
            <p><strong>Email:</strong> gitwala.vinay@gmail.com</p>
            <p><strong>Phone:</strong> 8081788927</p>
            <p><strong>Password:</strong> karvin123</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="gitwala.vinay@gmail.com or student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Verifying...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          New Student?{' '}
          <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Register Student Account
          </Link>
        </div>

      </div>
    </div>
  );
};
