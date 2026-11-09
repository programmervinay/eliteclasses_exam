import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  School, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../lib/supabase';
import type { StudentClass } from '../../types/database';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentClass, setStudentClass] = useState<StudentClass>('10th');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Teacher Registration options
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherCode, setTeacherCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate 10-digit mobile number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (isTeacher && email.trim().toLowerCase() !== 'gitwala.vinay@gmail.com') {
      if (teacherCode.trim() !== 'ELITE2026') {
        setErrorMsg('Invalid Teacher Passcode. Please contact Vinay Prajapati on WhatsApp for the teacher access code.');
        return;
      }
    }

    setLoading(true);

    const { error } = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      studentClass,
      schoolName: schoolName.trim() || undefined,
      password,
      isTeacher,
      teacherCode: teacherCode.trim() || undefined,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Registration failed. An account with this email may already exist.');
    } else {
      if (isTeacher || email.trim().toLowerCase() === 'gitwala.vinay@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
        
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25 mb-3">
            {isTeacher ? <ShieldCheck className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isTeacher ? 'Teacher / Admin Registration' : 'Student Registration'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Create your account on {APP_CONFIG.name} — Powered by {APP_CONFIG.creator}
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsTeacher(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isTeacher
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Student Account
          </button>
          <button
            type="button"
            onClick={() => setIsTeacher(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isTeacher
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Teacher / Staff Portal
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isTeacher ? 'Teacher Full Name *' : 'Student Full Name *'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder={isTeacher ? "e.g. Vinay Prajapati" : "e.g. Rahul Sharma"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Used to Sign In) *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder={isTeacher ? "gitwala.vinay@gmail.com" : "student@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              />
            </div>
            {isTeacher && email.trim().toLowerCase() === 'gitwala.vinay@gmail.com' && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                ✓ Primary Administrator Email recognized. Passcode not required.
              </span>
            )}
          </div>

          {/* Mobile & Class (or Teacher Passcode) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (10 Digits) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm font-mono focus:border-brand-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            {!isTeacher ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class / Standard *
                </label>
                <select
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value as StudentClass)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white font-semibold"
                >
                  <option value="6th">Class 6th</option>
                  <option value="7th">Class 7th</option>
                  <option value="8th">Class 8th</option>
                  <option value="9th">Class 9th</option>
                  <option value="10th">Class 10th</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teacher Access Passcode *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-purple-500" />
                  <input
                    type="password"
                    placeholder="Enter Passcode (ELITE2026)"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    disabled={email.trim().toLowerCase() === 'gitwala.vinay@gmail.com'}
                    className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 pl-10 pr-3.5 py-2.5 text-sm font-mono focus:border-purple-500 focus:outline-none dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional School / Institute */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isTeacher ? 'Teaching Center / Institute (Optional)' : 'School Name (Optional)'}
            </label>
            <div className="relative">
              <School className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={isTeacher ? "Elite_Classes Coaching Center" : "e.g. St. Xavier's High School"}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50 ${
              isTeacher
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/25'
            }`}
          >
            <span>{loading ? 'Creating Account...' : isTeacher ? 'Register as Teacher / Admin' : 'Create Student Account'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Sign In with Email & Password
          </Link>
        </div>

      </div>
    </div>
  );
};
