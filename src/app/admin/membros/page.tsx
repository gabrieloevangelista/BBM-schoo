'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  X,
  Save,
  Users
} from 'lucide-react';
import { Member } from '@/lib/db';
import Switch from '@/components/Switch';
import { AdminSkeleton } from '@/components/SkeletonLoaders';
import { customConfirm } from '@/components/CustomConfirm';

export default function MembrosAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setMembers(db.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  // Toggle Member Status (Ativo / Inativo)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.members = db.members.map((m: Member) => 
          m.id === id ? { ...m, status: newStatus } : m
        );

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete member
  const handleDeleteMember = async (id: string) => {
    const confirmed = await customConfirm(
      'Deseja excluir este membro permanentemente? Esta ação não pode ser desfeita.',
      'Excluir Membro'
    );
    if (!confirmed) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.members = db.members.filter((m: Member) => m.id !== id);
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-base flex items-center gap-2">
          Gerenciamento de Membros
        </h2>
        
        <button onClick={() => router.push('/admin/cadastrar')} className="btn-primary text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-2">
          <Plus size={16} />
          <span>Adicionar Membro</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Nenhum membro encontrado.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(193, 255, 7, 0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <th style={{ padding: '15px 12px' }}>Usuário</th>
                <th style={{ padding: '15px 12px' }}>Perfil</th>
                <th style={{ padding: '15px 12px' }}>Cargo / Bio</th>
                <th style={{ padding: '15px 12px' }}>Status Acesso</th>
                <th style={{ padding: '15px 12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr 
                  key={m.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    opacity: m.status === 'Inativo' ? 0.6 : 1
                  }}
                >
                  {/* User info */}
                  <td style={{ padding: '15px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {m.img ? (
                        <img src={m.img} alt={m.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(193, 255, 7, 0.2)' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(193, 255, 7, 0.1)', border: '1px solid rgba(193, 255, 7, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C1FF07', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {m.initials || 'US'}
                        </div>
                      )}
                      <div>
                        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{m.name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{m.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Profile Type */}
                  <td style={{ padding: '15px 12px' }}>
                    {m.member_type === 'admin' ? (
                      <span className="badge badge-lemon">Administrador</span>
                    ) : m.member_type === 'mentor' ? (
                      <span className="badge badge-green">Mentor</span>
                    ) : (
                      <span className="badge badge-gray">Mentorado</span>
                    )}
                  </td>

                  {/* Role */}
                  <td style={{ padding: '15px 12px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{m.role || '-'}</p>
                  </td>

                  {/* Status Switch */}
                  <td style={{ padding: '15px 12px' }}>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={m.status === 'Ativo'} 
                        onChange={() => handleToggleStatus(m.id, m.status)} 
                        disabled={m.id === user?.id} // Cannot disable self
                      />
                      <span className="text-xs" style={{ color: m.status === 'Ativo' ? '#34D399' : 'var(--text-secondary)' }}>
                        {m.status === 'Ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleDeleteMember(m.id)} 
                        disabled={m.id === user?.id}
                        className="outline-btn p-2 border-0 text-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed" 
                        style={{ minWidth: 'auto' }} 
                        title={m.id === user?.id ? "Não é possível excluir a si mesmo" : "Excluir Membro"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


    </div>
  );
}
