import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Zap, 
  Crown, 
  Medal, 
  Award, 
  GraduationCap, 
  ChevronRight, 
  Flame, 
  Sparkles,
  School,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Profile, StudentClass } from '../../types/database';

export const getStudentLevel = (xp: number) => {
  if (xp >= 1500) return { title: 'Grandmaster', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', nextAt: 2500 };
  if (xp >= 1000) return { title: 'Master', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', nextAt: 1500 };
  if (xp >= 600) return { title: 'Scholar', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', nextAt: 1000 };
  if (xp >= 300) return { title: 'Achiever', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', nextAt: 600 };
  if (xp >= 100) return { title: 'Explorer', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', nextAt: 300 };
  return { title: 'Novice', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', nextAt: 100 };
};

export const LeaderboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, class, school_name, xp_points, role, is_blocked')
          .eq('role', 'student')
          .order('xp_points', { ascending: false });

        if (error) throw error;
        // Exclude blocked or purged records
        const active = (data as Profile[] || []).filter(
          (s) => !s.is_blocked && !s.full_name?.startsWith('[FRAUD DELETED]')
        );
        setStudents(active);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'all' && s.class !== selectedClass) return false;
    return true;
  });

  const currentUserIndex = filteredStudents.findIndex((s) => s.id === user?.id);
  const userRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;
  const userXp = profile?.xp_points || 0;
  const userLevel = getStudentLevel(userXp);

  const top1 = filteredStudents[0];
  const top2 = filteredStudents[1];
  const top3 = filteredStudents[2];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Top Navigation & Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Student XP Leaderboard</span>
                <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                  <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Live Rank
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Compete across all classes, complete quizzes, and score higher marks to climb to #1!
              </p>
            </div>
          </div>
        </div>

        {/* User Quick Rank Pill */}
        {userRank && (
          <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-brand-200 block">Your Rank</span>
              <span className="text-xl font-black">#{userRank}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="pr-2">
              <span className="text-[10px] uppercase font-bold text-brand-200 block">Total XP</span>
              <span className="text-base font-black flex items-center gap-1 text-yellow-300">
                <Zap className="h-4 w-4 fill-current" />
                {userXp} XP
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Class Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
        <button
          type="button"
          onClick={() => setSelectedClass('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedClass === 'all'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          All Classes (Overall Leaderboard)
        </button>
        {(['10th', '9th', '8th', '7th', '6th'] as StudentClass[]).map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => setSelectedClass(cls)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedClass === cls
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Class {cls} Only
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating real-time student leaderboard..." />
      ) : (
        <>
          {/* Top 3 Podium (Shown if at least 2 students exist) */}
          {filteredStudents.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end">
              
              {/* #2 Rank (Silver) */}
              {top2 && (
                <div className="order-2 md:order-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-200" />
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xl shadow-inner">
                    🥈 2
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {top2.full_name}
                    {top2.id === user?.id && <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold">YOU</span>}
                  </h3>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Class {top2.class} {top2.school_name ? `• ${top2.school_name}` : ''}
                  </span>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm">
                    <Zap className="h-4 w-4 fill-slate-400 text-slate-400" />
                    <span>{top2.xp_points || 0} XP</span>
                  </div>
                </div>
              )}

              {/* #1 Rank (Gold Champion) */}
              {top1 && (
                <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-amber-500/10 via-white dark:via-slate-900 to-white dark:to-slate-900 border-2 border-amber-400/60 dark:border-amber-500/40 p-7 text-center shadow-2xl relative overflow-hidden scale-105">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                  <div className="mx-auto mb-2 flex h-6 items-center justify-center">
                    <Crown className="h-6 w-6 text-amber-500 fill-amber-400 animate-bounce" />
                  </div>
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/30">
                    🥇 1
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg">
                    {top1.full_name}
                    {top1.id === user?.id && <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold">YOU</span>}
                  </h3>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                    Leader of All Classes • Class {top1.class}
                  </span>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-base shadow-md shadow-amber-500/30">
                    <Zap className="h-4 w-4 fill-slate-950 text-slate-950" />
                    <span>{top1.xp_points || 0} XP</span>
                  </div>
                </div>
              )}

              {/* #3 Rank (Bronze) */}
              {top3 && (
                <div className="order-3 md:order-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-700 to-amber-600" />
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-black text-xl shadow-inner">
                    🥉 3
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {top3.full_name}
                    {top3.id === user?.id && <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold">YOU</span>}
                  </h3>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Class {top3.class} {top3.school_name ? `• ${top3.school_name}` : ''}
                  </span>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-black text-sm">
                    <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>{top3.xp_points || 0} XP</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-8">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Full Rankings ({filteredStudents.length} Students)
                </h3>
                <p className="text-xs text-slate-500">
                  Sorted by total XP accumulated across all examinations
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4 w-16 text-center">Rank</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">School</th>
                    <th className="p-4">Tier / Level</th>
                    <th className="p-4 text-right">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((st, index) => {
                    const rank = index + 1;
                    const isSelf = st.id === user?.id;
                    const level = getStudentLevel(st.xp_points || 0);

                    return (
                      <tr 
                        key={st.id} 
                        className={`transition-colors ${
                          isSelf 
                            ? 'bg-brand-50/70 dark:bg-brand-950/40 font-bold' 
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="p-4 text-center font-black">
                          {rank === 1 ? (
                            <span className="text-lg">🥇</span>
                          ) : rank === 2 ? (
                            <span className="text-lg">🥈</span>
                          ) : rank === 3 ? (
                            <span className="text-lg">🥉</span>
                          ) : (
                            <span className="text-slate-500 font-mono">#{rank}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs ${
                              isSelf 
                                ? 'bg-brand-600 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}>
                              {st.full_name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {st.full_name}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold">
                                    YOU
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                            Class {st.class}
                          </span>
                        </td>

                        <td className="p-4 text-slate-500">
                          {st.school_name || '—'}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${level.badge}`}>
                            {level.title}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 font-black text-sm text-amber-600 dark:text-amber-400">
                            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            {st.xp_points || 0} XP
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* How to Earn XP Information Card */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-black">How to Earn More XP & Top the Leaderboard</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Your XP increases every time you participate in examinations and perform well:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-amber-400 font-black block text-sm">+50 XP</span>
                <strong className="text-white block mt-0.5">Participation Reward</strong>
                <span className="text-slate-400 text-[11px]">Given for completing any quiz attempt</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-emerald-400 font-black block text-sm">+10 XP / Mark</span>
                <strong className="text-white block mt-0.5">Score Multiplier</strong>
                <span className="text-slate-400 text-[11px]">e.g. 15 marks scored = +150 XP</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-yellow-400 font-black block text-sm">+50 Bonus XP</span>
                <strong className="text-white block mt-0.5">High Distinctions</strong>
                <span className="text-slate-400 text-[11px]">Awarded for scoring 90% and above</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-blue-400 font-black block text-sm">+25 Bonus XP</span>
                <strong className="text-white block mt-0.5">Merit Bonus</strong>
                <span className="text-slate-400 text-[11px]">Awarded for scoring 75% and above</span>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
