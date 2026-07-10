'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456'); // Default mock password
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  // Read message or redirect warnings
  useEffect(() => {
    const msg = searchParams.get('msg');
    if (msg) {
      setNotification(decodeURIComponent(msg));
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && user.status === 'Ativo') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!email) {
      setErrorMsg('Por favor, informe seu e-mail.');
      setIsSubmitting(false);
      return;
    }

    const success = await login(email);
    if (!success) {
      setErrorMsg('Usuário não encontrado. Experimente os botões de acesso rápido abaixo.');
    }
    setIsSubmitting(false);
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep p-5">
      <div className="w-full max-w-[440px] p-8 md:p-10 bg-white/3 border border-primary-lemon/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-lemon/10 border border-primary-lemon flex items-center justify-center mx-auto mb-4 text-primary-lemon shadow-[0_0_15px_rgba(193,255,7,0.1)]">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">BBM School</h1>
          <p className="text-text-secondary text-sm font-medium mt-1 font-outfit">Portal Educacional Premium</p>
        </div>

        {/* Warning notification */}
        {notification && (
          <div className="p-3.5 bg-primary-lemon/8 border border-primary-lemon/30 rounded-lg text-primary-lemon text-xs font-medium mb-5 flex items-start gap-2.5 leading-normal">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <span>{notification}</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-accent-red/10 border border-accent-red/35 rounded-lg text-accent-red text-xs font-semibold mb-5 leading-normal">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-medium font-outfit">E-mail Corporativo</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-white/2 border border-primary-lemon/15 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-lemon focus:ring-1 focus:ring-primary-lemon transition duration-200 text-sm"
              placeholder="seuemail@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-text-secondary font-medium font-outfit">Senha de Acesso</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="w-full px-4 py-3 bg-white/2 border border-primary-lemon/15 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-lemon focus:ring-1 focus:ring-primary-lemon transition duration-200 text-sm"
              placeholder="••••••••"
              value={password}
              onChange={() => {}} // simulated input read-only password
              disabled={isSubmitting}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 bg-transparent border-0 text-text-secondary hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep font-bold rounded-lg hover:shadow-[0_0_15px_rgba(193,255,7,0.25)] transition duration-200 cursor-pointer text-sm font-outfit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verificando...' : 'Entrar no Portal'}
          </button>
        </form>

        {/* Quick access presets */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[10px] text-text-muted text-center font-bold mb-4 uppercase tracking-wider">
            Acesso Rápido para Testes
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={() => handleQuickLogin('admin@bbm.com')}
              className="py-2.5 px-2 bg-transparent border border-primary-lemon/20 text-primary-lemon hover:border-primary-lemon hover:bg-primary-lemon/5 font-semibold rounded-lg text-xs transition duration-200 cursor-pointer"
            >
              Administrador
            </button>
            <button 
              onClick={() => handleQuickLogin('master@bbm.com')}
              className="py-2.5 px-2 bg-transparent border border-primary-lemon/20 text-primary-lemon hover:border-primary-lemon hover:bg-primary-lemon/5 font-semibold rounded-lg text-xs transition duration-200 cursor-pointer"
            >
              Mentor Mestre
            </button>
            <button 
              onClick={() => handleQuickLogin('mentor@bbm.com')}
              className="py-2.5 px-2 bg-transparent border border-primary-lemon/20 text-primary-lemon hover:border-primary-lemon hover:bg-primary-lemon/5 font-semibold rounded-lg text-xs transition duration-200 cursor-pointer"
            >
              Mentorado Comum
            </button>
            <button 
              onClick={() => handleQuickLogin('blocked@bbm.com')}
              className="py-2.5 px-2 bg-transparent border border-accent-red/20 text-accent-red hover:border-accent-red hover:bg-accent-red/5 font-semibold rounded-lg text-xs transition duration-200 cursor-pointer"
            >
              Membro Inativo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
