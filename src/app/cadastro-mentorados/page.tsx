'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldAlert } from 'lucide-react';

export default function SecretRegistrationPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    // Validations
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Todos os campos são obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-mentorado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido ao realizar cadastro.');
      }

      // Auto-Login
      const loginSuccess = await login(email);
      if (loginSuccess) {
        router.push('/dashboard');
      } else {
        router.push('/login?msg=' + encodeURIComponent('Cadastro realizado com sucesso! Faça login abaixo.'));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro na comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep p-5">
      <div className="w-full max-w-[460px] p-8 md:p-10 bg-white/3 border border-primary-lemon/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-lemon/10 border border-primary-lemon flex items-center justify-center mx-auto mb-4 text-primary-lemon shadow-[0_0_15px_rgba(193,255,7,0.1)]">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Cadastro de Mentorado</h1>
          <p className="text-primary-lemon text-sm font-semibold mt-1 font-outfit uppercase tracking-wider">Acesso Secreto</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-accent-red/10 border border-accent-red/35 rounded-lg text-accent-red text-xs font-semibold mb-5 flex items-start gap-2.5 leading-normal">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-medium font-outfit">Nome Completo</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-white/2 border border-primary-lemon/15 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-lemon focus:ring-1 focus:ring-primary-lemon transition duration-200 text-sm"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-medium font-outfit">E-mail</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-white/2 border border-primary-lemon/15 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-lemon focus:ring-1 focus:ring-primary-lemon transition duration-200 text-sm"
              placeholder="Digite seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-medium font-outfit">Senha</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-white/2 border border-primary-lemon/15 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-lemon focus:ring-1 focus:ring-primary-lemon transition duration-200 text-sm"
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-medium font-outfit">Confirme a Senha</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-white/2 border border-primary-lemon/15 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-lemon focus:ring-1 focus:ring-primary-lemon transition duration-200 text-sm"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep font-bold rounded-lg hover:shadow-[0_0_15px_rgba(193,255,7,0.25)] transition duration-200 cursor-pointer text-sm font-outfit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Concluir Cadastro & Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
