import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  Users, 
  Award, 
  ShieldAlert, 
  BarChart3, 
  ArrowLeft,
  GraduationCap,
  Radio
} from 'lucide-react';
import { APP_CONFIG } from '../../lib/supabase';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();

  const navLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Examinations', path: '/admin/exams', icon: BookOpen },
    { name: 'Send Notifications', path: '/admin/notifications', icon: Radio },
    { name: 'Question Bank', path: '/admin/questions', icon: HelpCircle },
    { name: 'Student Accounts', path: '/admin/students', icon: Users },
    { name: 'Results & Scores', path: '/admin/results', icon: Award },
    { name: 'Suspicious Activity', path: '/admin/suspicious', icon: ShieldAlert },
    { name: 'Performance Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const content = (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-full p-4">
      <div>
        <div className="flex items-center gap-2.5 px-3 py-3 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {APP_CONFIG.name}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Teacher Portal
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to Student Dashboard</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop view */}
      <div className="hidden lg:block h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 w-64 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
