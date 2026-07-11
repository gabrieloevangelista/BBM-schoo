'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '@/lib/db';
import { UserPlus, ArrowLeft } from 'lucide-react';

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputClass = "bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-md p-3 text-sm text-text-base focus:border-[var(--color-input-border-focus)] outline-none transition-colors w-full";
const selectClass = "bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-md p-3 w-full text-sm text-text-base appearance-none outline-none";

export default function CadastrarUsuarioPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState<'admin' | 'mentor' | 'mentorado'>('mentorado');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor, preencha nome e e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const newMember: Member = {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          email,
          role,
          member_type: memberType,
          status: 'Ativo',
          theme: 'dark',
          added_at: new Date().toISOString(),
          initials: name.substring(0, 2).toUpperCase()
        };

        if (!db.members) db.members = [];
        db.members.push(newMember);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // Redirect back to members page after success
        router.push('/admin/membros');
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-3xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
          <button onClick={() => router.push('/admin/membros')} className="hover:text-text-base flex items-center gap-1 transition-colors">
            <ArrowLeft size={12} /> VOLTAR
          </button>
          <span>/</span>
          <span>USUÁRIOS</span>
        </div>
        <h2 className="text-xl font-bold text-text-base flex items-center gap-2">
          <UserPlus size={24} className="text-primary-lemon" />
          Cadastrar Novo Usuário
        </h2>
        <p className="text-xs text-text-secondary">Crie um novo acesso para membro, mestre ou administrador no ecossistema.</p>
      </div>

      <div className="glass-panel p-8 flex flex-col gap-6">
        <form onSubmit={handleSaveMember} className="flex flex-col gap-6">
          <FormField label="Nome Completo *">
            <input 
              type="text" 
              className={inputClass} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: João da Silva" 
              required
            />
          </FormField>

          <FormField label="E-mail de Acesso *">
            <input 
              type="email" 
              className={inputClass} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Ex: joao@empresa.com" 
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Cargo / Especialidade">
              <input 
                type="text" 
                className={inputClass} 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                placeholder="Ex: Head de Vendas" 
              />
            </FormField>

            <FormField label="Tipo de Perfil">
              <div className="relative">
                <select 
                  className={selectClass} 
                  value={memberType} 
                  onChange={e => setMemberType(e.target.value as any)}
                >
                  <option value="mentorado">Mentorado (Padrão)</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </FormField>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[var(--color-glass-border)]">
            <button 
              type="button" 
              onClick={() => router.push('/admin/membros')} 
              className="flex-1 glass-panel text-text-base text-xs font-bold uppercase tracking-widest py-4 rounded transition-colors text-center hover:bg-[var(--color-glass-hover-bg)]"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !name.trim() || !email.trim()} 
              className="flex-1 btn-primary text-xs font-bold uppercase tracking-widest py-4 rounded disabled:opacity-40"
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
