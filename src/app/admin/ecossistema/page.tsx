'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff, 
  X,
  Save,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { customConfirm } from '@/components/CustomConfirm';
import { EcosystemBanner } from '@/lib/db';
import Switch from '@/components/Switch';
import { AdminSkeleton } from '@/components/SkeletonLoaders';

export default function EcossistemaBannersAdminPage() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<EcosystemBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [image, setImage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        // Sort by sequence order
        const list = (db.ecosystem_banners || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        setBanners(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBanners();
    }
  }, [user]);

  // Shift sequence order up
  const handleShiftUp = async (index: number) => {
    if (index === 0) return; // already at top
    
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        const list = (db.ecosystem_banners || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        
        // Swap sequence_order values
        const current = list[index];
        const prev = list[index - 1];
        
        const temp = current.sequence_order;
        current.sequence_order = prev.sequence_order;
        prev.sequence_order = temp;

        db.ecosystem_banners = list;

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Shift sequence order down
  const handleShiftDown = async (index: number) => {
    if (index === banners.length - 1) return; // already at bottom

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        const list = (db.ecosystem_banners || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        
        // Swap sequence_order values
        const current = list[index];
        const next = list[index + 1];
        
        const temp = current.sequence_order;
        current.sequence_order = next.sequence_order;
        next.sequence_order = temp;

        db.ecosystem_banners = list;

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Visibility Switch (disabled true/false)
  const handleToggleDisabled = async (id: string) => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.ecosystem_banners = db.ecosystem_banners.map((b: EcosystemBanner) => 
          b.id === id ? { ...b, disabled: !b.disabled } : b
        );

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (id: string) => {
    const confirmed = await customConfirm(
      'Deseja excluir este banner permanentemente?',
      'Excluir Banner do Ecossistema'
    );
    if (!confirmed) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.ecosystem_banners = db.ecosystem_banners.filter((b: EcosystemBanner) => b.id !== id);
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open creation modal
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedBannerId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setTag('');
    setImage('https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=600');
    setCtaText('Acessar');
    setCtaLink('/comunidade');
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (banner: EcosystemBanner) => {
    setModalMode('edit');
    setSelectedBannerId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setDescription(banner.description || '');
    setTag(banner.tag || '');
    setImage(banner.image);
    setCtaText(banner.cta_text);
    setCtaLink(banner.cta_link);
    setShowModal(true);
  };

  // Form submission
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !image || !ctaText || !ctaLink) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        if (modalMode === 'create') {
          const maxOrder = db.ecosystem_banners.length > 0 
            ? Math.max(...db.ecosystem_banners.map((b: any) => b.sequence_order)) 
            : 0;

          const newBanner: EcosystemBanner = {
            id: `banner-${Date.now()}`,
            title,
            subtitle,
            description,
            tag: tag.toUpperCase(),
            image,
            cta_text: ctaText,
            cta_link: ctaLink,
            disabled: false,
            sequence_order: maxOrder + 1,
            created_at: new Date().toISOString()
          };

          if (!db.ecosystem_banners) db.ecosystem_banners = [];
          db.ecosystem_banners.push(newBanner);
        } else {
          // Edit mode
          db.ecosystem_banners = db.ecosystem_banners.map((b: EcosystemBanner) => {
            if (b.id === selectedBannerId) {
              return {
                ...b,
                title,
                subtitle,
                description,
                tag: tag.toUpperCase(),
                image,
                cta_text: ctaText,
                cta_link: ctaLink
              };
            }
            return b;
          });
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setShowModal(false);
        fetchBanners();
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
        <h2 className="text-xl font-bold text-text-base flex items-center gap-2">Gerenciamento de Banners</h2>
        
        <button onClick={openCreateModal} className="btn-primary text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-2">
          <Plus size={16} />
          <span>Novo Slide</span>
        </button>
      </div>

      {/* Banners List Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
        {banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Nenhum banner cadastrado no ecossistema.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(193, 255, 7, 0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <th style={{ padding: '15px 12px', width: '80px' }}>Ordem</th>
                <th style={{ padding: '15px 12px' }}>Miniatura</th>
                <th style={{ padding: '15px 12px' }}>Título</th>
                <th style={{ padding: '15px 12px' }}>Tag / Categoria</th>
                <th style={{ padding: '15px 12px' }}>Link de Destino</th>
                <th style={{ padding: '15px 12px' }}>Status</th>
                <th style={{ padding: '15px 12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b, idx) => (
                <tr 
                  key={b.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    opacity: b.disabled ? 0.5 : 1
                  }}
                >
                  {/* Reorder Arrows Column */}
                  <td style={{ padding: '15px 12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => handleShiftUp(idx)} 
                        disabled={idx === 0}
                        className="outline-btn p-1 border-0 disabled:opacity-30"
                        style={{ minWidth: 'auto', color: 'var(--text-secondary)' }}
                        title="Subir posição"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={() => handleShiftDown(idx)} 
                        disabled={idx === banners.length - 1}
                        className="outline-btn p-1 border-0 disabled:opacity-30"
                        style={{ minWidth: 'auto', color: 'var(--text-secondary)' }}
                        title="Descer posição"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </td>

                  {/* Thumbnail */}
                  <td style={{ padding: '15px 12px' }}>
                    <img src={b.image} alt={b.title} style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(193, 255, 7, 0.1)' }} />
                  </td>

                  {/* Title */}
                  <td style={{ padding: '15px 12px' }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{b.title}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{b.subtitle}</p>
                    </div>
                  </td>

                  {/* Tag */}
                  <td style={{ padding: '15px 12px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{b.tag || 'ECOSISTEMA'}</span>
                  </td>

                  {/* CTA link */}
                  <td style={{ padding: '15px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <a href={b.cta_link} className="flex-center gap-1 hover:underline" style={{ color: 'var(--color-primary-lemon)', textDecoration: 'none', justifyContent: 'flex-start' }}>
                      <span>{b.cta_text}</span>
                      <ExternalLink size={10} />
                    </a>
                  </td>

                  {/* Visibility Switch */}
                  <td style={{ padding: '15px 12px' }}>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={!b.disabled} 
                        onChange={() => handleToggleDisabled(b.id)} 
                      />
                      <span className="text-xs" style={{ color: b.disabled ? 'var(--text-secondary)' : '#34D399' }}>
                        {b.disabled ? 'Inativo' : 'Ativo'}
                      </span>
                    </div>
                  </td>

                  {/* Actions (Edit / Delete) */}
                  <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button onClick={() => openEditModal(b)} className="outline-btn p-2 border-0 text-gray-400 hover:text-white" style={{ minWidth: 'auto' }} title="Editar slide">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteBanner(b.id)} className="outline-btn p-2 border-0 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }} title="Excluir slide">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide Edit / Create Modal */}
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
            className="glass-panel"
            style={{
              maxWidth: '550px',
              width: '100%',
              padding: '30px',
              border: '1px solid var(--color-primary-lemon)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', fontFamily: 'var(--font-outfit)' }}>
                {modalMode === 'create' ? 'Adicionar Banner Destaque' : 'Editar Slide'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="outline-btn border-0 p-1 text-gray-400 hover:text-white"
                style={{ minWidth: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subtítulo</label>
                  <input type="text" className="form-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição Breve</label>
                <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Tag / Categoria</label>
                  <input type="text" className="form-input" placeholder="Ex: INVESTIMENTOS" value={tag} onChange={e => setTag(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">URL da Imagem Banner *</label>
                  <input type="text" className="form-input" value={image} onChange={e => setImage(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Texto do Botão (CTA) *</label>
                  <input type="text" className="form-input" value={ctaText} onChange={e => setCtaText(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Link de Destino (CTA) *</label>
                  <input type="text" className="form-input" value={ctaLink} onChange={e => setCtaLink(e.target.value)} required />
                </div>
              </div>

              <button 
                type="submit" 
                className="gold-glow-btn w-full" 
                style={{ padding: '12px', marginTop: '15px', width: '100%' }}
              >
                <Save size={16} />
                <span>Salvar Configurações</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
