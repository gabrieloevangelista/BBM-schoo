'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState<'admin' | 'master' | 'mentor'>('master');
  const [role, setRole] = useState('');

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

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setRole('');
    setMemberType('master');
    setShowModal(true);
  };

  // Create new member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor, preencha nome e e-mail.');
      return;
    }

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

        setShowModal(false);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="page-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={28} className="text-primary-lemon" />
          Gerenciamento de Membros
        </h1>
        
        <button onClick={openCreateModal} className="btn-primary text-xs" style={{ padding: '10px 16px' }}>
          <Plus size={16} />
          <span>Adicionar Membro</span>
        </button>
      </div>
      <p className="page-subtitle">Acesso restrito para administradores. Gerencie acessos, adicione e exclua membros da plataforma.</p>

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
                    ) : m.member_type === 'master' ? (
                      <span className="badge badge-green">Mestre</span>
                    ) : (
                      <span className="badge badge-gray">Membro</span>
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

      {/* Create Member Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="modal-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '30px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', fontFamily: 'var(--font-outfit)' }}>
                Adicionar Novo Membro
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="outline-btn border-0 p-1 text-gray-400 hover:text-white"
                style={{ minWidth: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMember}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Perfil *</label>
                  <select 
                    className="form-input" 
                    value={memberType} 
                    onChange={e => setMemberType(e.target.value as 'admin' | 'master' | 'mentor')} 
                    required
                  >
                    <option value="mentor">Membro Padrão</option>
                    <option value="master">Mestre (Masterclass)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Título</label>
                  <input type="text" className="form-input" placeholder="Ex: CEO" value={role} onChange={e => setRole(e.target.value)} />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full mt-4" 
                style={{ padding: '12px' }}
              >
                <Save size={16} />
                <span>Salvar Membro</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
