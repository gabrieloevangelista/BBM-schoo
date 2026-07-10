'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  const { user, logout } = useAuth();

  const isInactive = user && user.status !== 'Ativo';

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#010105',
        padding: '20px'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px 30px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,74,74,0.03)',
          borderColor: 'rgba(255, 74, 74, 0.2)'
        }}
      >
        <div 
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: 'rgba(255,74,74,0.1)', 
            border: '1px solid #FF4A4A',
            margin: '0 auto 20px auto',
            color: '#FF4A4A'
          }}
          className="flex-center"
        >
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>Acesso Restrito</h1>
        
        {isInactive ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
              Olá, <strong style={{ color: '#fff' }}>{user.name}</strong>. Sua conta está atualmente marcada como <span className="badge badge-red">Inativa</span> na plataforma. 
              <br /><br />
              Por favor, entre em contato com a administração da <strong>BBM School</strong> ou regularize sua assinatura para liberar o seu acesso.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
              Esta página ou recurso é de uso exclusivo para administradores da plataforma.
              <br />
              Seu perfil atual é de <strong>{user ? (user.member_type === 'master' ? 'Mentor Master' : 'Mentorado') : 'Visitante'}</strong>.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          {!isInactive && user && (
            <Link 
              href="/dashboard" 
              className="gold-glow-btn"
              style={{ padding: '12px', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <LayoutDashboard size={18} />
              <span>Voltar ao Dashboard</span>
            </Link>
          )}

          <button 
            onClick={logout} 
            className="outline-btn"
            style={{ padding: '12px', fontSize: '0.9rem', width: '100%', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            <LogOut size={18} />
            <span>Fazer Logout / Trocar de Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
