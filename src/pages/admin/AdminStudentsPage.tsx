import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Trash2,
  AlertTriangle,
  UserX,
  X,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Check,
  Copy,
  Terminal,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import type { Profile, UserRole } from '../../types/database';

export const AdminStudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Deletion Modal state
  const [accountToDelete, setAccountToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmedFraud, setConfirmedFraud] = useState(false);

  // Block Modal state
  const [accountToBlock, setAccountToBlock] = useState<Profile | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const [showSqlHelper, setShowSqlHelper] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data as Profile[]);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleRole = async (student: Profile) => {
    const newRole: UserRole = student.role === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Are you sure you want to change ${student.full_name}'s role to ${newRole}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', student.id);

      if (error) throw error;
      fetchStudents();
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  // Block / Unblock student
  const handleToggleBlock = async (student: Profile, shouldBlock: boolean) => {
    setIsBlocking(true);
    try {
      const { error } = await supabase.rpc('admin_block_student', {
        p_student_id: student.id,
        p_blocked: shouldBlock,
      });

      if (error) {
        // Fallback direct profile update
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ is_blocked: shouldBlock, updated_at: new Date().toISOString() })
          .eq('id', student.id);
        if (updErr) throw updErr;
      }

      setAccountToBlock(null);
      await fetchStudents();
      alert(`Student ${student.full_name} has been ${shouldBlock ? 'BLOCKED' : 'UNBLOCKED'}.`);
    } catch (err: any) {
      console.error('Error toggling block:', err);
      alert(`Error: ${err.message || 'Failed to update student status.'}`);
    } finally {
      setIsBlocking(false);
    }
  };

  // Permanently Delete Student Account
  const handleDeleteStudentAccount = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Call Supabase RPC
      const { error: rpcError } = await supabase.rpc('admin_delete_student', {
        p_student_id: accountToDelete.id,
      });

      if (!rpcError) {
        setAccountToDelete(null);
        setConfirmedFraud(false);
        await fetchStudents();
        alert(`Account for ${accountToDelete.full_name} and all test records permanently deleted.`);
        return;
      }

      console.warn('RPC deletion fallback:', rpcError);

      // 2. Fallback manual cascade cleanup
      const { data: attempts } = await supabase
        .from('attempts')
        .select('id')
        .eq('student_id', accountToDelete.id);

      if (attempts && attempts.length > 0) {
        const attemptIds = attempts.map((a) => a.id);
        await supabase.from('attempt_answers').delete().in('attempt_id', attemptIds);
      }

      await supabase.from('suspicious_events').delete().eq('student_id', accountToDelete.id);
      await supabase.from('results').delete().eq('student_id', accountToDelete.id);
      await supabase.from('attempts').delete().eq('student_id', accountToDelete.id);
      await supabase.from('profiles').delete().eq('id', accountToDelete.id);

      setAccountToDelete(null);
      setConfirmedFraud(false);
      await fetchStudents();
      alert(`Account for ${accountToDelete.full_name} has been deleted.`);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Error deleting account: ${err.message || 'Please check permissions.'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const sqlSnippet = `-- Active RPC Functions in Supabase:
-- 1. admin_block_student(p_student_id uuid, p_blocked boolean)
-- 2. admin_delete_student(p_student_id uuid) (hard deletes from auth.users & cascades all records)`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filter students (exclude already marked fraud/terminated accounts)
  const filteredStudents = students.filter((s) => {
    if (s.full_name?.startsWith('[FRAUD DELETED]')) return false;
    if (s.school_name === '[ACCOUNT PERMANENTLY TERMINATED BY TEACHER]') return false;
    if (selectedClass !== 'all' && s.class !== selectedClass) return false;
    if (selectedRole !== 'all' && s.role !== selectedRole) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = s.full_name?.toLowerCase().includes(query);
      const matchEmail = s.email?.toLowerCase().includes(query);
      const matchPhone = s.phone?.includes(query);
      return matchName || matchEmail || matchPhone;
    }

    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Student Accounts</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800">
                {filteredStudents.length} Total
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student registrations, class eligibility, and delete suspicious or fraud accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSqlHelper(!showSqlHelper)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm"
              title="View Hard Purge SQL"
            >
              <Terminal className="h-3.5 w-3.5 text-brand-600" />
              <span>Database Purge RPC</span>
            </button>
          </div>
        </div>

        {/* Database Purge RPC Helper Card (Collapsible) */}
        {showSqlHelper && (
          <div className="mb-6 p-4 rounded-3xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Optional: 1-Click Database Purge RPC (Removes from auth.users permanently)
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white transition-all"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              Paste this in your Supabase SQL Editor once to enable permanent account purge (deleting login credentials and session tokens).
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-36">
              {sqlSnippet}
            </pre>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, email, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-1.5 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Classes</option>
            <option value="6th">Class 6th</option>
            <option value="7th">Class 7th</option>
            <option value="8th">Class 8th</option>
            <option value="9th">Class 9th</option>
            <option value="10th">Class 10th</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Roles</option>
            <option value="student">Student Only</option>
            <option value="admin">Teacher / Admin</option>
          </select>
        </div>

        {/* Students Table */}
        {loading ? (
          <LoadingSpinner message="Loading registered student records..." />
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Students Matching Filter</h3>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search query or class filter.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">XP Points</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">School</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((st) => {
                    const isAdmin = st.role === 'admin' || st.role === 'teacher';
                    const isSelf = st.id === user?.id || st.email === 'gitwala.vinay@gmail.com';
                    const isBlocked = Boolean(st.is_blocked);

                    return (
                      <tr key={st.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${isBlocked ? 'bg-red-50/20 dark:bg-red-950/20' : ''}`}>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {st.full_name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ID: {st.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{st.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{st.phone}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 font-bold text-brand-700 dark:text-brand-300">
                            Class {st.class}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 font-black text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                            <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{st.xp_points || 0} XP</span>
                          </span>
                        </td>
                        <td className="p-4">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                              <Ban className="h-3 w-3" />
                              <span>BLOCKED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="h-3 w-3" />
                              <span>ACTIVE</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500">
                          {st.school_name || '—'}
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(st.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {st.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleRole(st)}
                              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-1"
                            >
                              {isAdmin ? 'Demote' : 'Promote Admin'}
                            </button>

                            {!isSelf && (
                              <>
                                {/* BLOCK / UNBLOCK BUTTON */}
                                {isBlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBlock(st, false)}
                                    disabled={isBlocking}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all"
                                    title="Unblock Student"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                    <span>Unblock</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setAccountToBlock(st)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900 transition-all"
                                    title="Block Student"
                                  >
                                    <Ban className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                    <span>Block</span>
                                  </button>
                                )}

                                {/* DELETE BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccountToDelete(st);
                                    setConfirmedFraud(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 transition-all"
                                  title="Permanently Delete Student"
                                >
                                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Block Confirmation Modal */}
        {accountToBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-900/60">
              <button
                type="button"
                onClick={() => setAccountToBlock(null)}
                disabled={isBlocking}
                className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-5">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                  <Ban className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Block Student Account?
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  This student will be blocked from logging in and taking exams. Their test history will remain safely stored.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Student Name:</span>
                  <strong className="text-slate-900 dark:text-white">{accountToBlock.full_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Email:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{accountToBlock.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Class / School:</span>
                  <span className="text-slate-700 dark:text-slate-300">Class {accountToBlock.class} • {accountToBlock.school_name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setAccountToBlock(null)}
                  disabled={isBlocking}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBlocking}
                  onClick={() => handleToggleBlock(accountToBlock, true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/25 hover:bg-amber-700 transition-all"
                >
                  {isBlocking ? (
                    <span>Blocking...</span>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      <span>Confirm Block</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Student Account Confirmation Modal */}
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-red-200 dark:border-red-900/60">
              
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={isDeleting}
                className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-5">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                  <UserX className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Permanently Delete Account?
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  This action permanently removes this student's account, login credentials, and all test records from the website and database.
                </p>
              </div>

              {/* Target Account Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Student Name:</span>
                  <strong className="text-slate-900 dark:text-white">{accountToDelete.full_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Email:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{accountToDelete.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Mobile:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{accountToDelete.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Class / School:</span>
                  <span className="text-slate-700 dark:text-slate-300">Class {accountToDelete.class} • {accountToDelete.school_name || 'N/A'}</span>
                </div>
              </div>

              {/* Consequence Alert */}
              <div className="rounded-xl bg-red-50/70 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 mb-5 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  What will be purged:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-red-700 dark:text-red-300">
                  <li>Student login authentication & Supabase credentials</li>
                  <li>All completed exam attempts & answers</li>
                  <li>Scorecards, percentages, and results</li>
                  <li>Proctor logs & anti-cheat records</li>
                </ul>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer mb-5 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={confirmedFraud}
                  onChange={(e) => setConfirmedFraud(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 mt-0.5 h-4 w-4"
                />
                <span className="leading-snug">
                  I confirm that <strong>{accountToDelete.full_name}</strong> should be permanently deleted from the database.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setAccountToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!confirmedFraud || isDeleting}
                  onClick={handleDeleteStudentAccount}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isDeleting ? (
                    <span>Deleting Account...</span>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
