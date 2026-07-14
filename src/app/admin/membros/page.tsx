'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  X,
  Save,
  Users,
  Upload,
  CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Member } from '@/lib/db';
import Switch from '@/components/Switch';
import { AdminSkeleton } from '@/components/SkeletonLoaders';
import { customConfirm } from '@/components/CustomConfirm';

export default function MembrosAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // File input ref for import
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Bulk Edit Actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await customConfirm(`Deseja excluir permanentemente os ${selectedIds.length} membros selecionados?`, 'Excluir em Massa');
    if (!confirmed) return;
    
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.members = db.members.filter((m: Member) => !selectedIds.includes(m.id));
        await fetch('/api/db', { method: 'POST', body: JSON.stringify(db) });
        setSelectedIds([]);
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkStatus = async (newStatus: 'Ativo' | 'Inativo') => {
    if (selectedIds.length === 0) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.members = db.members.map((m: Member) => 
          selectedIds.includes(m.id) ? { ...m, status: newStatus } : m
        );
        await fetch('/api/db', { method: 'POST', body: JSON.stringify(db) });
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkRole = async (newType: 'admin' | 'mentor' | 'mentorado') => {
    if (selectedIds.length === 0) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.members = db.members.map((m: Member) => 
          selectedIds.includes(m.id) ? { ...m, member_type: newType } : m
        );
        await fetch('/api/db', { method: 'POST', body: JSON.stringify(db) });
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Select All
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(members.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle individual selection
  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // File Upload (XLSX / CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          customConfirm('O arquivo está vazio ou com formato inválido.', 'Erro na importação');
          return;
        }

        // Map data to new members
        const newMembers: Member[] = data.map((row: any) => {
          // Normaliza as keys para facilitar independente da capitalização
          const getVal = (possibleKeys: string[], defaultVal = '') => {
            for (const k of possibleKeys) {
              const match = Object.keys(row).find(key => key.toLowerCase().trim() === k.toLowerCase());
              if (match && row[match]) return row[match].toString().trim();
            }
            return defaultVal;
          };

          const name = getVal(['Nome', 'Name', 'Nome Completo']);
          const email = getVal(['Email', 'E-mail']);
          const role = getVal(['Cargo', 'Role', 'Profissão']);
          const company = getVal(['Empresa', 'Company']);
          const industry = getVal(['Indústria', 'Industry', 'Setor']);
          const location = getVal(['Localização', 'Local', 'Location', 'Cidade']);
          const perfilStr = getVal(['Perfil', 'Tipo', 'Profile']).toLowerCase();
          
          let member_type = 'mentorado';
          if (perfilStr.includes('admin')) member_type = 'admin';
          else if (perfilStr.includes('mentor')) member_type = 'mentor';

          const statusStr = getVal(['Status', 'Acesso']).toLowerCase();
          const status = statusStr.includes('inativo') ? 'Inativo' : 'Ativo';

          const initials = name ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

          return {
            id: `member-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            name: name || 'Usuário Importado',
            email: email || 'sem-email@bbm.com',
            role,
            company,
            industry,
            location,
            initials,
            img: '',
            bio: '',
            username: email ? email.split('@')[0] : `user_${Date.now()}`,
            member_type,
            theme: 'dark',
            status,
            added_at: new Date().toISOString()
          } as Member;
        });

        // Save to DB
        const response = await fetch('/api/db');
        if (response.ok) {
          const db = await response.json();
          db.members = [...db.members, ...newMembers];
          
          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });
          
          fetchMembers();
          if (fileInputRef.current) fileInputRef.current.value = '';
        }

      } catch (err) {
        console.error('Error importing file', err);
      }
    };
    reader.readAsBinaryString(file);
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
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current?.click()} className="outline-btn text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-2">
            <Upload size={16} />
            <span>Importar</span>
          </button>
          <button onClick={() => router.push('/admin/cadastrar')} className="btn-primary text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-2">
            <Plus size={16} />
            <span>Adicionar Membro</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="glass-panel mb-6 p-4 flex items-center justify-between border-primary-lemon/30 bg-primary-lemon/5">
          <div className="flex items-center gap-2 text-primary-lemon font-bold text-sm">
            <CheckSquare size={18} />
            <span>{selectedIds.length} membro(s) selecionado(s)</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Alterar Perfil:</span>
              <select 
                className="form-input text-xs py-1 px-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkRole(e.target.value as 'admin' | 'mentor' | 'mentorado');
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Selecione...</option>
                <option value="admin">Administrador</option>
                <option value="mentor">Mentor</option>
                <option value="mentorado">Mentorado</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Alterar Status:</span>
              <select 
                className="form-input text-xs py-1 px-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatus(e.target.value as 'Ativo' | 'Inativo');
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Selecione...</option>
                <option value="Ativo">Ativar</option>
                <option value="Inativo">Inativar</option>
              </select>
            </div>
            
            <div className="h-6 w-px bg-white/10 mx-1"></div>
            
            <button 
              onClick={handleBulkDelete}
              className="outline-btn text-xs py-1.5 px-3 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-300"
            >
              Excluir Selecionados
            </button>
          </div>
        </div>
      )}

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
                <th style={{ padding: '15px 12px', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    className="accent-primary-lemon cursor-pointer"
                    checked={members.length > 0 && selectedIds.length === members.length}
                    onChange={handleSelectAll}
                  />
                </th>
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
                  {/* Selection Checkbox */}
                  <td style={{ padding: '15px 12px' }}>
                    <input 
                      type="checkbox" 
                      className="accent-primary-lemon cursor-pointer"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => handleSelectOne(m.id)}
                    />
                  </td>

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
