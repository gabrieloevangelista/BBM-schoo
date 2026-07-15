'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldAlert, ArrowRight, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const msg = searchParams.get('msg');
    if (msg) setNotification(decodeURIComponent(msg));
  }, [searchParams]);

  useEffect(() => {
    if (user && user.status === 'Ativo') router.push('/dashboard');
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
    if (!success) setErrorMsg('Usuário não encontrado. Use os atalhos abaixo para testar.');
    setIsSubmitting(false);
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('123456');
    setErrorMsg('');
  };

  const features = [
    'Masterclasses com mentores especialistas',
    'Biblioteca de recursos exclusivos',
    'Calendário de eventos ao vivo',
    'Comunidade de alto nível',
  ];

  return (
    <div className="min-h-screen flex bg-[#12131a]">

      {/* ── LEFT PANEL — Branding ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden bg-[#171821] border-r border-white/[0.04] p-14">

        {/* Background geometric accent */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #C1FF07 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #C1FF07 0%, transparent 70%)' }}
          />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <img src="/logo_BBM school H cópia.png" alt="BBM School" className="h-8 object-contain" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#C1FF07] uppercase font-outfit">
              Portal Educacional Premium
            </span>
            <h1 className="text-5xl font-extrabold text-white leading-[1.1] font-outfit tracking-tight">
              Acelere sua<br />
              <span className="text-[#C1FF07]">carreira</span> com<br />
              mentores reais.
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-[400px] font-inter">
              Acesso exclusivo a conteúdo, comunidade e oportunidades da BBM School.
            </p>
          </div>

          {/* Feature list */}
          <ul className="flex flex-col gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white/60 text-sm font-inter">
                <CheckCircle size={15} className="text-[#C1FF07] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs font-inter">
            © {new Date().getFullYear()} BBM School · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-16 relative">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 self-start">
          <img src="/logo_BBM school H cópia.png" alt="BBM School" className="h-7 object-contain" />
        </div>

        <div className="w-full max-w-[380px] flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-extrabold text-white font-outfit tracking-tight">
              Entrar na plataforma
            </h2>
            <p className="text-white/40 text-sm font-inter">
              Use suas credenciais de acesso BBM School.
            </p>
          </div>

          {/* Notifications */}
          {notification && (
            <div className="p-3.5 bg-[#C1FF07]/6 border border-[#C1FF07]/20 text-[#C1FF07] text-xs font-medium flex items-start gap-2.5 leading-relaxed">
              <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" />
              <span>{notification}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-500/8 border border-red-500/25 text-red-400 text-xs font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 font-outfit">
                E-mail Corporativo
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] text-white text-sm font-inter placeholder-white/20 outline-none transition-all duration-200 focus:border-white/20 focus:bg-white/[0.05]"
                style={{ borderRadius: '2px' }}
                placeholder="seuemail@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 font-outfit">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] text-white text-sm font-inter placeholder-white/20 outline-none transition-all duration-200 focus:border-white/20 focus:bg-white/[0.05] pr-11"
                  style={{ borderRadius: '2px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={() => {}}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-white/30 hover:text-white/70 cursor-pointer transition-colors p-0"
                  style={{ minWidth: 'auto' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#C1FF07] text-[#12131a] font-bold text-sm font-outfit tracking-wide cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[#aee600] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ borderRadius: '2px' }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#12131a]/30 border-t-[#12131a] rounded-full animate-spin inline-block" />
                  Verificando...
                </span>
              ) : (
                <>
                  Entrar no Portal
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick access */}
          <div className="flex flex-col gap-4 pt-2 border-t border-white/[0.05]">
            <p className="text-[10px] font-bold tracking-[0.18em] text-white/25 uppercase font-outfit">
              Acesso Rápido para Testes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Administrador', email: 'admin@bbm.com', color: 'lemon' },
                { label: 'Mentor Mestre', email: 'master@bbm.com', color: 'lemon' },
                { label: 'Mentorado Comum', email: 'mentor@bbm.com', color: 'lemon' },
                { label: 'Membro Inativo', email: 'blocked@bbm.com', color: 'red' },
              ].map((item) => (
                <button
                  key={item.email}
                  onClick={() => handleQuickLogin(item.email)}
                  style={{ borderRadius: '2px' }}
                  className={`py-2 px-3 bg-transparent text-xs font-semibold font-outfit cursor-pointer transition-all duration-200 text-left ${
                    item.color === 'red'
                      ? 'border border-red-500/20 text-red-400 hover:border-red-500/50 hover:bg-red-500/5'
                      : 'border border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
