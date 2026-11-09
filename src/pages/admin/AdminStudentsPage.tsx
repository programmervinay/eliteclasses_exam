import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserCheck, 
  Phone, 
  Mail, 
  School,
  GraduationCap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Profile, StudentClass, UserRole } from '../../types/database';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

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

  const filteredStudents = students.filter((s) => {
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Student Accounts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student registrations, class assignments, and access privileges
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total Enrolled: <strong className="text-slate-900 dark:text-white">{students.length} Students</strong>
          </div>
        </div>

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
                    <th className="p-4">School</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((st) => {
                    const isAdmin = st.role === 'admin' || st.role === 'teacher';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {st.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
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
                          <button
                            type="button"
                            onClick={() => handleToggleRole(st)}
                            className="text-xs font-semibold text-brand-600 hover:underline"
                          >
                            {isAdmin ? 'Demote' : 'Promote Admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
