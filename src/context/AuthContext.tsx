import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, StudentClass, UserRole } from '../types/database';

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  studentClass: StudentClass;
  schoolName?: string;
  password: string;
  isTeacher?: boolean;
  teacherCode?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isPasswordRecovery: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (data: RegisterData) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  clearPasswordRecovery: () => void;
  refreshProfile: () => Promise<void>;
}

const RECOVERY_STORAGE_KEY = 'elite_password_recovery';

const hasRecoveryUrlParams = () => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  if (hash.includes('error=') || search.includes('error=')) return false;
  return hash.includes('type=recovery') || search.includes('type=recovery');
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (hasRecoveryUrlParams()) {
      sessionStorage.setItem(RECOVERY_STORAGE_KEY, '1');
      return true;
    }
    return sessionStorage.getItem(RECOVERY_STORAGE_KEY) === '1';
  });

  const clearPasswordRecovery = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
    }
    setIsPasswordRecovery(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      const prof = data as Profile;
      if (prof?.full_name?.startsWith('[FRAUD DELETED]') || prof?.school_name === '[ACCOUNT PERMANENTLY TERMINATED BY TEACHER]') {
        await supabase.auth.signOut().catch(() => {});
        return null;
      }
      return prof;
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      } else if (!hasRecoveryUrlParams() && !window.location.search.includes('code=')) {
        clearPasswordRecovery();
      }
      setLoading(false);
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem(RECOVERY_STORAGE_KEY, '1');
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        clearPasswordRecovery();
      } else if (event === 'USER_UPDATED') {
        clearPasswordRecovery();
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      clearPasswordRecovery();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (data.user) {
        const prof = await fetchProfile(data.user.id);
        if (!prof) {
          await supabase.auth.signOut().catch(() => {});
          return { error: new Error('This account has been permanently terminated by the administrator.') };
        }
        setProfile(prof);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const isAdminAccount = normalizedEmail === 'gitwala.vinay@gmail.com' || (data.isTeacher && data.teacherCode === 'ELITE2026');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone: data.phone.trim(),
            class: data.studentClass,
            school_name: data.schoolName?.trim() || null,
            teacher_code: data.teacherCode?.trim() || null,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Fallback profile creation in case trigger was delayed
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.fullName.trim(),
          email: normalizedEmail,
          phone: data.phone.trim(),
          class: data.studentClass,
          school_name: data.schoolName?.trim() || null,
          role: isAdminAccount ? 'admin' : 'student',
        });
        if (profileError) {
          console.warn('Upsert profile notice:', profileError.message);
        }
        const prof = await fetchProfile(authData.user.id);
        setProfile(prof);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const logout = async () => {
    clearPasswordRecovery();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      clearPasswordRecovery();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    profile?.role === 'teacher' ||
    user?.email?.toLowerCase() === 'gitwala.vinay@gmail.com'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        isPasswordRecovery,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        clearPasswordRecovery,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
