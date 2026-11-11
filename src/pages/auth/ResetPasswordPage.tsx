import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../lib/supabase';

const parseUrlAuthError = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);

  const errorDesc =
    hashParams.get('error_description') ||
    searchParams.get('error_description') ||
    hashParams.get('error') ||
    searchParams.get('error');

  if (!errorDesc) return null;
  return decodeURIComponent(errorDesc.replace(/\+/g, ' '));
};

const hasTokenInUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return (
    (hash.includes('access_token=') && hash.includes('type=recovery')) ||
    search.includes('code=') ||
    search.includes('type=recovery')
  );
};

export const ResetPasswordPage: React.FC = () => {
  const {
    user,
    session,
    loading: authLoading,
    isAdmin,
    isPasswordRecovery,
    resetPassword,
    updatePassword,
    clearPasswordRecovery,
  } = useAuth();
  const navigate = useNavigate();

  // Request-reset-email state
  const [email, setEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Set-new-password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Shared UI & error state
  const [errorMsg, setErrorMsg] = useState<string | null>(() => parseUrlAuthError());
  const [forceRequestMode, setForceRequestMode] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState<boolean>(() => hasTokenInUrl());

  // Wait briefly if URL contains ?code= or #access_token while Supabase finishes exchanging token
  useEffect(() => {
    if (!verifyingLink) return;
    if (session && (isPasswordRecovery || !authLoading)) {
      setVerifyingLink(false);
      return;
    }
    const timer = setTimeout(() => {
      setVerifyingLink(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [verifyingLink, session, isPasswordRecovery, authLoading]);

  // Show the Update New Password form whenever recovery session is active
  const isUpdatePasswordMode =
    !forceRequestMode &&
    !passwordUpdated &&
    Boolean(session && (isPasswordRecovery || hasTokenInUrl()));

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRequestLoading(true);

    const { error } = await resetPassword(email);
    setRequestLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to send password reset email. Please try again.');
    } else {
      setEmailSent(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please enter the same password twice.');
      return;
    }

    setUpdateLoading(true);
    const { error } = await updatePassword(newPassword);
    setUpdateLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Could not update password. Your recovery link may have expired.');
    } else {
      setPasswordUpdated(true);
      // Clean URL hash/query cleanly
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', '/reset-password');
      }
    }
  };

  const handleSwitchToRequest = () => {
    clearPasswordRecovery();
    setForceRequestMode(true);
    setErrorMsg(null);
    setEmailSent(false);
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', '/reset-password');
    }
  };

  if (verifyingLink || (authLoading && isPasswordRecovery)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 text-center">
          <Loader2 className="mx-auto h-10 w-10 text-brand-600 animate-spin mb-3" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Verifying Recovery Link...
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Please wait while we verify your password reset session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-3">
            {passwordUpdated ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : isUpdatePasswordMode ? (
              <KeyRound className="h-6 w-6" />
            ) : (
              <Mail className="h-6 w-6" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {passwordUpdated
              ? 'Password Updated!'
              : isUpdatePasswordMode
              ? 'Create New Password'
              : 'Reset Password'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {passwordUpdated
              ? `Your ${APP_CONFIG.name} account password has been changed.`
              : isUpdatePasswordMode
              ? 'Enter a strong new password for your account below'
              : 'Enter your registered email to receive a recovery link'}
          </p>
        </div>

        {/* 1. Password Successfully Updated Screen */}
        {passwordUpdated ? (
          <div className="text-center py-2 space-y-4">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-xs text-emerald-800 dark:text-emerald-300">
              Your new password is active. You are signed in and ready to continue.
            </div>
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard', { replace: true })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 transition-all"
            >
              <span>Continue to {isAdmin ? 'Admin Portal' : 'Student Dashboard'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : isUpdatePasswordMode ? (
          /* 2. Set New Password Form (Arrived from Gmail Reset Link) */
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {user?.email && (
              <div className="rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 px-3.5 py-2.5 text-xs text-brand-700 dark:text-brand-300 flex items-center justify-between gap-2">
                <span className="truncate">
                  Account: <strong className="font-semibold">{user.email}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                  Verified
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-10 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-10 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              <span>{updateLoading ? 'Updating Password...' : 'Update Password'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSwitchToRequest}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Need a different reset link?
              </button>
            </div>
          </form>
        ) : emailSent ? (
          /* 3. Reset Email Sent Confirmation */
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reset Instructions Sent!
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              If an account with <strong className="text-slate-700 dark:text-slate-300">{email}</strong> exists, a password reset link has been sent to your Gmail inbox. Check your Spam folder if you don&apos;t see it within 1 minute.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={clearPasswordRecovery}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Sign In</span>
              </Link>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1.5"
              >
                Try another email address
              </button>
            </div>
          </div>
        ) : (
          /* 4. Request Password Reset Email Form */
          <form onSubmit={handleRequestReset} className="space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={requestLoading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 disabled:opacity-50"
            >
              {requestLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                onClick={clearPasswordRecovery}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
