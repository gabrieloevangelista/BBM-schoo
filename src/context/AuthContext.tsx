'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Member } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: Member | null;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async (storedUserId: string) => {
    try {
      const { data, error } = await supabase.from('members').select('*').eq('id', storedUserId).single();
      if (data) {
        setUser(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const storedUserId = localStorage.getItem('bbm_user_id');
      if (storedUserId) {
        const activeUser = await fetchUser(storedUserId);
        if (!activeUser) {
          localStorage.removeItem('bbm_user_id');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Monitor status blocks and route permissions
  useEffect(() => {
    if (isLoading) return;

    // Secret registration url and login page bypass
    if (pathname === '/login' || pathname === '/cadastro-mentorados' || pathname === '/sem-permissao' || pathname === '/cadastro') {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Inactivity and Bloqueios checks
    if (user.status !== 'Ativo') {
      router.push('/sem-permissao');
      return;
    }

    // Admin & Exclusive page restrictions
    const isAdminRoute = pathname.startsWith('/admin') || pathname === '/oportunidades' || pathname === '/projetos';
    
    if (isAdminRoute) {
      if (user.member_type === 'admin') {
        // Admin has full access, do nothing
      } else if (user.member_type === 'mentor') {
        // Mentor can only access specific administrative routes like registering classes
        if (!pathname.startsWith('/admin/reordenacao')) {
          router.push('/sem-permissao');
        }
      } else {
        // Mentorado has no access to admin routes
        router.push('/sem-permissao');
      }
    }
  }, [user, pathname, isLoading, router]);

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('members').select('*').ilike('email', email).maybeSingle();
      
      if (data) {
        setUser(data);
        localStorage.setItem('bbm_user_id', data.id);
        
        if (data.status !== 'Ativo') {
          router.push('/sem-permissao');
        } else {
          router.push('/dashboard');
        }
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bbm_user_id');
    router.push('/login');
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUser(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
