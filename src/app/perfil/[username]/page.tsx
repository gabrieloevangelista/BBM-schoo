'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { customConfirm } from '@/components/CustomConfirm';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Building, 
  Compass, 
  Edit, 
  Save, 
  X, 
  UserCheck, 
  UserPlus, 
  UserMinus, 
  UserX, 
  Search,
  Globe,
  Instagram,
  Linkedin
} from 'lucide-react';
import { Link as LinkIcon, Award, Target, Trophy, Clock, PlayCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { PerfilSkeleton } from '@/components/SkeletonLoaders';
import { Member, MemberConnection } from '@/lib/db';

export default function MemberProfilePage() {
  const { user, refreshUser } = useAuth();
  const { username } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState<Member | null>(null);
  const [connections, setConnections] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allConnections, setAllConnections] = useState<MemberConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'conexoes' | 'descobrir'>('info');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editLinkedIn, setEditLinkedIn] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search in discovery
  const [discoveryQuery, setDiscoveryQuery] = useState('');

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/db');
      if (!response.ok) throw new Error('Failed to load database');
      const db = await response.json();

      setAllMembers(db.members || []);
      setAllConnections(db.member_connections || []);

      // 1. Find profile
      const found = db.members.find((m: Member) => m.username === username);
      if (!found) {
        // Fallback to active user if username not found
        if (user) {
          router.push(`/perfil/${user.username}`);
        } else {
          router.push('/login');
        }
        return;
      }
      setProfile(found);

      // Prepopulate edit forms
      setEditName(found.name || '');
      setEditRole(found.role || '');
      setEditCompany(found.company || '');
      setEditIndustry(found.industry || '');
      setEditLocation(found.location || '');
      setEditBio(found.bio || '');
      setEditUsername(found.username || '');
      setEditAvatar(found.img || '');
      setEditLinkedIn(found.linkedin || '');
      setEditInstagram(found.instagram || '');
      setEditWebsite(found.website || '');

      // 2. Load connected members for this profile
      const connList = (db.member_connections || []).filter((c: MemberConnection) => 
        c.status === 'accepted' && (c.requester_id === found.id || c.receiver_id === found.id)
      );

      const connectedUsers = connList.map((c: MemberConnection) => {
        const otherId = c.requester_id === found.id ? c.receiver_id : c.requester_id;
        return db.members.find((m: Member) => m.id === otherId);
      }).filter(Boolean);

      setConnections(connectedUsers);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && username) {
      loadProfileData();
    }
  }, [user, username]);

  // Username validation: lowercase letters, numbers, underscores or periods only
  const validateUsername = (uname: string) => {
    const regex = /^[a-z0-9_.]+$/;
    return regex.test(uname);
  };

  // Avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('O arquivo deve ser menor que 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!editName || !editUsername) {
      setErrorMsg('Nome e nome de usuário são obrigatórios.');
      return;
    }

    if (!validateUsername(editUsername)) {
      setErrorMsg('Nome de usuário inválido. Use apenas letras minúsculas, números, sublinhas (_) ou pontos (.).');
      return;
    }

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        // Uniqueness check
        const duplicate = db.members.some(
          (m: Member) => m.username === editUsername && m.id !== profile?.id
        );
        if (duplicate) {
          setErrorMsg('Este nome de usuário já está em uso.');
          return;
        }

        // Update member
        db.members = db.members.map((m: Member) => {
          if (m.id === profile?.id) {
            const nameParts = editName.trim().split(/\s+/);
            const initials = nameParts.length > 1
              ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
              : nameParts[0][0].toUpperCase();

            return {
              ...m,
              name: editName,
              username: editUsername,
              role: editRole,
              company: editCompany,
              industry: editIndustry,
              location: editLocation,
              bio: editBio,
              img: editAvatar,
              initials,
              linkedin: editLinkedIn,
              instagram: editInstagram,
              website: editWebsite
            };
          }
          return m;
        });

        const saveResponse = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        if (saveResponse.ok) {
          setSuccessMsg('Perfil atualizado com sucesso!');
          setIsEditing(false);
          await refreshUser();
          
          if (editUsername !== profile?.username) {
            router.push(`/perfil/${editUsername}`);
          } else {
            loadProfileData();
          }
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Erro ao salvar alterações.');
    }
  };

  // Connection management helpers
  const getConnectionState = (otherId: string) => {
    if (!user) return 'none';
    const conn = allConnections.find(c => 
      (c.requester_id === user.id && c.receiver_id === otherId) ||
      (c.requester_id === otherId && c.receiver_id === user.id)
    );
    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    if (conn.requester_id === user.id) return 'pending_sent';
    return 'pending_received';
  };

  // Connect request
  const handleConnect = async (otherId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const newConn: MemberConnection = {
          id: `conn-${Date.now()}`,
          requester_id: user.id,
          receiver_id: otherId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (!db.member_connections) db.member_connections = [];
        db.member_connections.push(newConn);

        // Notify receiver
        const notification = {
          id: `notification-${Date.now()}`,
          user_id: otherId,
          title: 'Solicitação de Conexão',
          description: `${user.name} enviou uma solicitação de conexão de networking.`,
          type: 'mentoria',
          link: `/perfil/${user.username}`,
          is_read: false,
          created_at: new Date().toISOString()
        };
        db.notifications.unshift(notification);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        loadProfileData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Accept Connection
  const handleAcceptConnect = async (otherId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.member_connections = db.member_connections.map((c: MemberConnection) => {
          if ((c.requester_id === otherId && c.receiver_id === user.id)) {
            return {
              ...c,
              status: 'accepted',
              updated_at: new Date().toISOString()
            };
          }
          return c;
        });

        // Notify sender
        const notification = {
          id: `notification-${Date.now()}`,
          user_id: otherId,
          title: 'Conexão Aceita',
          description: `${user.name} aceitou sua solicitação de conexão.`,
          type: 'mentoria',
          link: `/perfil/${user.username}`,
          is_read: false,
          created_at: new Date().toISOString()
        };
        db.notifications.unshift(notification);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        loadProfileData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reject or Cancel Request
  const handleRejectConnect = async (otherId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.member_connections = db.member_connections.filter((c: MemberConnection) => 
          !((c.requester_id === user.id && c.receiver_id === otherId) ||
            (c.requester_id === otherId && c.receiver_id === user.id))
        );

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        loadProfileData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dissolve Connection (Desfazer)
  const handleRemoveConnect = async (otherId: string) => {
    if (!user) return;
    const confirmed = await customConfirm(
      'Deseja desfazer esta conexão de networking?',
      'Desfazer Conexão'
    );
    if (!confirmed) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        // Section 7.5: dissolve removes row regardless of who is requester or receiver
        db.member_connections = db.member_connections.filter((c: MemberConnection) => 
          !((c.requester_id === user.id && c.receiver_id === otherId) ||
            (c.requester_id === otherId && c.receiver_id === user.id))
        );

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        loadProfileData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <PerfilSkeleton />;
  }

  if (!profile) return null;

  const isOwnProfile = user && user.id === profile.id;
  const connectionState = getConnectionState(profile.id);

  // Discovery Filter
  const filteredDiscovery = allMembers.filter(m => {
    // Hide self and blocked users
    if (m.id === user?.id || m.status !== 'Ativo') return false;
    
    // Search filter
    const query = discoveryQuery.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(query) ||
                        (m.company && m.company.toLowerCase().includes(query)) ||
                        (m.role && m.role.toLowerCase().includes(query)) ||
                        (m.industry && m.industry.toLowerCase().includes(query));

    return matchSearch;
  });

  return (
    <div>
      {/* Messages */}
      {errorMsg && (
        <div className="badge badge-red w-full mb-4 p-3 text-sm flex-start" style={{ display: 'block' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="badge badge-green w-full mb-4 p-3 text-sm flex-start" style={{ display: 'block' }}>
          {successMsg}
        </div>
      )}

      {/* Profile Header */}
      <section className="glass-panel p-8 md:p-10 mb-8 flex items-center flex-wrap gap-8 bg-gradient-to-br from-primary-lemon/4 to-transparent">
        {/* Avatar Area */}
        <div className="relative">
          {profile.img ? (
            <img 
              src={profile.img} 
              alt={profile.name} 
              className="w-24 h-24 rounded-full object-cover border-2 border-primary-lemon shadow-[0_0_15px_rgba(193,255,7,0.15)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-lemon/10 border-2 border-primary-lemon text-primary-lemon text-3xl font-extrabold flex items-center justify-center font-outfit shadow-[0_0_15px_rgba(193,255,7,0.1)]">
              {profile.initials}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex-grow">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-outfit m-0">{profile.name}</h1>
            <span className="badge badge-lemon text-[10px] font-bold uppercase tracking-wider">
              {profile.member_type === 'admin' ? 'Admin' : profile.member_type === 'master' ? 'Mestre' : 'Membro'}
            </span>
          </div>
          <p className="text-primary-lemon text-sm font-semibold mt-1">
            @{profile.username}
          </p>
          
          <div className="flex gap-4 flex-wrap mt-3 text-xs text-text-secondary">
            {profile.role && <span className="flex items-center gap-1.5"><Briefcase size={14} /> {profile.role} em {profile.company}</span>}
            {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.location}</span>}
          </div>
        </div>

        {/* Profile Action (Edit vs Connect) */}
        <div>
          {isOwnProfile ? (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="outline-btn text-xs"
              style={{ padding: '8px 16px', borderRadius: '2px' }}
            >
              <Edit size={14} />
              <span>{isEditing ? 'Cancelar' : 'Editar Perfil'}</span>
            </button>
          ) : (
            <div className="flex gap-2.5">
              {connectionState === 'none' && (
                <button 
                  onClick={() => handleConnect(profile.id)} 
                  className="btn-primary text-xs"
                  style={{ padding: '8px 16px', borderRadius: '2px' }}
                >
                  <UserPlus size={14} />
                  <span>Conectar</span>
                </button>
              )}
              {connectionState === 'pending_sent' && (
                <button 
                  onClick={() => handleRejectConnect(profile.id)} 
                  className="outline-btn text-xs"
                  style={{ padding: '8px 16px', borderRadius: '2px' }}
                >
                  <UserMinus size={14} />
                  <span>Cancelar Solicitação</span>
                </button>
              )}
              {connectionState === 'pending_received' && (
                <>
                  <button 
                    onClick={() => handleAcceptConnect(profile.id)} 
                    className="btn-primary text-xs"
                    style={{ padding: '8px 16px', borderRadius: '2px' }}
                  >
                    <UserCheck size={14} />
                    <span>Aceitar</span>
                  </button>
                  <button 
                    onClick={() => handleRejectConnect(profile.id)} 
                    className="outline-btn text-xs text-accent-red hover:text-white"
                    style={{ padding: '8px 16px', borderRadius: '2px', borderColor: 'rgba(255,82,82,0.2)' }}
                  >
                    <UserX size={14} />
                    <span>Recusar</span>
                  </button>
                </>
              )}
              {connectionState === 'connected' && (
                <button 
                  onClick={() => handleRemoveConnect(profile.id)} 
                  className="outline-btn text-xs text-accent-red hover:text-white"
                  style={{ padding: '8px 16px', borderRadius: '2px', borderColor: 'rgba(255,82,82,0.2)' }}
                >
                  <UserMinus size={14} />
                  <span>Desfazer Conexão</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Edit Form Toggle */}
      {isEditing && isOwnProfile && (
        <section className="glass-panel p-8 mb-8">
          <h3 className="text-lg font-bold text-white mb-6 font-outfit">Editar Minhas Informações</h3>
          
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Nome Completo *</label>
                <input type="text" className="form-input text-sm" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Nome de Usuário *</label>
                <input type="text" className="form-input text-sm" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
                <span className="text-[10px] text-text-muted mt-1 leading-none">
                  Apenas letras minúsculas, números, sublinhas (_) ou pontos (.).
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Cargo</label>
                <input type="text" className="form-input text-sm" value={editRole} onChange={e => setEditRole(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Empresa</label>
                <input type="text" className="form-input text-sm" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Indústria / Área</label>
                <input type="text" className="form-input text-sm" value={editIndustry} onChange={e => setEditIndustry(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Localização</label>
                <input type="text" className="form-input text-sm" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary font-medium font-outfit">Biografia / Resumo</label>
              <textarea 
                className="form-input text-sm min-h-[100px] resize-y" 
                value={editBio} 
                onChange={e => setEditBio(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Link LinkedIn</label>
                <input type="url" className="form-input text-sm" value={editLinkedIn} onChange={e => setEditLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/seuperfil" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Link Instagram</label>
                <input type="url" className="form-input text-sm" value={editInstagram} onChange={e => setEditInstagram(e.target.value)} placeholder="https://instagram.com/seuuser" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Website Pessoal</label>
                <input type="url" className="form-input text-sm" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="https://seusite.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary font-medium font-outfit">Avatar (Imagem de Perfil)</label>
                <input type="file" className="form-input text-xs" accept="image/*" onChange={handleAvatarChange} style={{ padding: '6px 12px' }} />
                <span className="text-[10px] text-text-muted mt-1 leading-none">
                  Tamanho máximo: 2MB.
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="outline-btn text-xs font-semibold"
                style={{ padding: '9px 20px', borderRadius: '2px' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary text-xs"
                style={{ padding: '9px 20px', borderRadius: '2px' }}
              >
                <Save size={14} />
                <span>Salvar Perfil</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-primary-lemon/20 mb-6 gap-5">
        <button 
          onClick={() => setActiveTab('info')} 
          className={`bg-transparent border-0 border-b-2 py-2 px-1 cursor-pointer font-semibold text-sm font-outfit transition-all duration-200 ${
            activeTab === 'info' ? 'border-primary-lemon text-primary-lemon' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Informações
        </button>
        <button 
          onClick={() => setActiveTab('conexoes')} 
          className={`bg-transparent border-0 border-b-2 py-2 px-1 cursor-pointer font-semibold text-sm font-outfit transition-all duration-200 ${
            activeTab === 'conexoes' ? 'border-primary-lemon text-primary-lemon' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Rede ({connections.length})
        </button>
        {isOwnProfile && (
          <button 
            onClick={() => setActiveTab('descobrir')} 
            className={`bg-transparent border-0 border-b-2 py-2 px-1 cursor-pointer font-semibold text-sm font-outfit transition-all duration-200 ${
              activeTab === 'descobrir' ? 'border-primary-lemon text-primary-lemon' : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            Descobrir Membros
          </button>
        )}
      </div>

      {/* Tabs Panels */}
      <div>
        
        {/* Tab 1: Info */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            
            {/* Bio Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '12px' }}>Sobre Mim</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {profile.bio || 'Este membro ainda não preencheu a biografia.'}
              </p>
            </div>

            {/* Career & Sector Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px' }}>Atuação Profissional</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#C1FF07' }}><Building size={18} /></div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empresa / Organização</p>
                    <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{profile.company || 'Não informada'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#C1FF07' }}><Compass size={18} /></div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Setor / Indústria</p>
                    <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{profile.industry || 'Não informada'}</p>
                  </div>
                </div>

                {/* Social media links */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="outline-btn p-2" style={{ minWidth: 'auto' }} title="LinkedIn">
                      <Linkedin size={16} />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noreferrer" className="outline-btn p-2" style={{ minWidth: 'auto' }} title="Instagram">
                      <Instagram size={16} />
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="outline-btn p-2" style={{ minWidth: 'auto' }} title="Website">
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Conexoes */}
        {activeTab === 'conexoes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {connections.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nenhuma conexão aceita até o momento.
              </div>
            ) : (
              connections.map(conn => (
                <div 
                  key={conn.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px',
                    cursor: 'pointer' 
                  }}
                  onClick={() => router.push(`/perfil/${conn.username}`)}
                >
                  {conn.img ? (
                    <img src={conn.img} alt={conn.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#C1FF07' }} className="flex-center font-bold">
                      {conn.initials}
                    </div>
                  )}

                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conn.role}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Descobrir (Networking discovery, active self-only) */}
        {activeTab === 'descobrir' && isOwnProfile && (
          <div>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar membros por nome, cargo, empresa..."
                value={discoveryQuery}
                onChange={e => setDiscoveryQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredDiscovery.length === 0 ? (
                <div className="glass-panel" style={{ padding: '30px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum membro encontrado.
                </div>
              ) : (
                filteredDiscovery.map(member => {
                  const state = getConnectionState(member.id);

                  return (
                    <div 
                      key={member.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '20px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        gap: '15px'
                      }}
                    >
                      <div 
                        style={{ display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => router.push(`/perfil/${member.username}`)}
                      >
                        {member.img ? (
                          <img src={member.img} alt={member.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#C1FF07', flexShrink: 0 }} className="flex-center font-bold">
                            {member.initials}
                          </div>
                        )}

                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.role || 'Membro Elite'} em {member.company || 'BBM'}
                          </p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{member.industry}</span>
                        </div>
                      </div>

                      {/* Connection Buttons */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                        {state === 'none' && (
                          <button onClick={() => handleConnect(member.id)} className="gold-glow-btn text-xs w-full" style={{ padding: '8px' }}>
                            <UserPlus size={12} />
                            <span>Conectar</span>
                          </button>
                        )}
                        {state === 'pending_sent' && (
                          <button onClick={() => handleRejectConnect(member.id)} className="outline-btn text-xs w-full" style={{ padding: '8px', borderColor: 'var(--text-muted)' }}>
                            <UserMinus size={12} />
                            <span>Cancelar Solicitação</span>
                          </button>
                        )}
                        {state === 'pending_received' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button onClick={() => handleAcceptConnect(member.id)} className="gold-glow-btn text-xs" style={{ padding: '8px' }}>
                              <UserCheck size={12} />
                              <span>Aceitar</span>
                            </button>
                            <button onClick={() => handleRejectConnect(member.id)} className="outline-btn text-xs" style={{ padding: '8px', borderColor: '#FF4A4A', color: '#FF4A4A' }}>
                              <UserX size={12} />
                              <span>Recusar</span>
                            </button>
                          </div>
                        )}
                        {state === 'connected' && (
                          <button onClick={() => handleRemoveConnect(member.id)} className="outline-btn text-xs w-full" style={{ padding: '8px', borderColor: '#FF4A4A', color: '#FF4A4A' }}>
                            <UserMinus size={12} />
                            <span>Desfazer Conexão</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
