'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RecursosSkeleton } from '@/components/SkeletonLoaders';
import { 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  FileVideo, 
  FileQuestion,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { customConfirm } from '@/components/CustomConfirm';
import { Resource, Lesson } from '@/lib/db';

export default function RecursosPage() {
  const { user } = useAuth();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Admin select bulk states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal create states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newLessonId, setNewLessonId] = useState('');
  const [newAvailableAt, setNewAvailableAt] = useState('');

  const fetchResourcesData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setLessons(db.lessons || []);
        
        let list = db.resources || [];
        // Apply time-visibility filter for non-admin
        if (user?.member_type !== 'admin') {
          const now = new Date();
          list = list.filter((r: Resource) => {
            if (!r.available_at) return true;
            return new Date(r.available_at) <= now;
          });
        }
        setResources(list);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchResourcesData();
    }
  }, [user]);

  // Helper to map category by extension
  const detectCategoryAndFormat = (url: string): { category: 'spreadsheet' | 'document' | 'presentation' | 'other'; format: string } => {
    if (!url) return { category: 'other', format: 'unknown' };
    const parts = url.split('.');
    const ext = parts[parts.length - 1].toLowerCase().split('?')[0];

    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { category: 'spreadsheet', format: ext };
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return { category: 'document', format: ext };
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return { category: 'presentation', format: ext };
    }
    return { category: 'other', format: ext };
  };

  // Add resource handler
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newFileUrl || !newLessonId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const { category, format } = detectCategoryAndFormat(newFileUrl);

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const newRes: Resource = {
          id: `resource-${Date.now()}`,
          lesson_id: newLessonId,
          title: newTitle,
          category,
          description: newDescription,
          file_url: newFileUrl,
          format: format.toUpperCase(),
          size: '1.2 MB', // Simulated size
          available_at: newAvailableAt ? new Date(newAvailableAt).toISOString() : undefined,
          created_at: new Date().toISOString()
        };

        if (!db.resources) db.resources = [];
        db.resources.push(newRes);

        // Notify users if this resource is released now
        const now = new Date();
        const isAvailableNow = !newAvailableAt || new Date(newAvailableAt) <= now;
        if (isAvailableNow) {
          const notification = {
            id: `notification-${Date.now()}`,
            user_id: null,
            title: 'Novo Recurso Liberado',
            description: `O arquivo "${newTitle}" foi adicionado à central de recursos.`,
            type: 'recurso',
            link: '/recursos',
            is_read: false,
            created_at: new Date().toISOString()
          };
          db.notifications.unshift(notification);
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // Clear and close
        setNewTitle('');
        setNewDescription('');
        setNewFileUrl('');
        setNewLessonId('');
        setNewAvailableAt('');
        setShowAddModal(false);
        fetchResourcesData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk deletion
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await customConfirm(
      `Deseja excluir permanentemente os ${selectedIds.size} recursos selecionados?`,
      'Excluir Materiais de Apoio'
    );
    if (!confirmed) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.resources = db.resources.filter((r: Resource) => !selectedIds.has(r.id));
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setSelectedIds(new Set());
        fetchResourcesData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk visibility update
  const handleBulkReleaseNow = async () => {
    if (selectedIds.size === 0) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.resources = db.resources.map((r: Resource) => {
          if (selectedIds.has(r.id)) {
            return {
              ...r,
              available_at: new Date().toISOString() // Release now
            };
          }
          return r;
        });

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setSelectedIds(new Set());
        fetchResourcesData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResources.map(r => r.id)));
    }
  };

  const getResourceIcon = (category: string) => {
    switch (category) {
      case 'spreadsheet': return <FileSpreadsheet className="text-green-400" size={18} />;
      case 'document': return <FileText className="text-blue-400" size={18} />;
      case 'presentation': return <FileVideo className="text-orange-400" size={18} />;
      default: return <FileQuestion className="text-gray-400" size={18} />;
    }
  };

  const getLessonTitle = (lessonId: string) => {
    const l = lessons.find(les => les.id === lessonId);
    return l ? l.title : 'Material Geral';
  };

  // Filter resources
  const filteredResources = resources.filter(res => {
    const matchQuery = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || res.category === selectedCategory;
    return matchQuery && matchCategory;
  });

  const isAdmin = user?.member_type === 'admin';

  if (isLoading) {
    return <RecursosSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit m-0">Biblioteca de Recursos</h1>
          <p className="text-text-secondary text-sm m-0 mt-1">Materiais de apoio exclusivos, modelos financeiros e diretrizes táticas para acelerar a performance.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-4 py-2 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep rounded-lg text-xs font-bold hover:shadow-[0_0_12px_rgba(193,255,7,0.2)] cursor-pointer transition-all duration-200 flex items-center gap-1.5 font-outfit"
          >
            <Plus size={16} />
            <span>Adicionar Recurso</span>
          </button>
        )}
      </div>

      {/* Search and Category Cards */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Search */}
        <div className="relative max-w-md">
          <input 
            type="text" 
            className="form-input pl-10 pr-4 py-2.5 text-xs w-full" 
            placeholder="Pesquisar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="absolute left-3.5 top-3 text-text-muted" />
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Todos os Arquivos */}
          <div 
            onClick={() => setSelectedCategory('all')}
            className={`glass-panel p-5 cursor-pointer flex gap-4 items-start transition-all duration-200 ${
              selectedCategory === 'all' 
                ? 'border-[#C1FF07]/30 bg-[#C1FF07]/5 shadow-[0_0_15px_rgba(193,255,7,0.05)]' 
                : 'hover:bg-white/5'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-white/5 text-[#C1FF07]">
              <FileQuestion size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1 font-outfit">Todos os Arquivos</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Todos os downloads consolidados.</p>
            </div>
          </div>

          {/* Card 2: PDFs Executivos */}
          <div 
            onClick={() => setSelectedCategory('document')}
            className={`glass-panel p-5 cursor-pointer flex gap-4 items-start transition-all duration-200 ${
              selectedCategory === 'document' 
                ? 'border-[#C1FF07]/30 bg-[#C1FF07]/5 shadow-[0_0_15px_rgba(193,255,7,0.05)]' 
                : 'hover:bg-white/5'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-white/5 text-[#C1FF07]">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1 font-outfit">PDFs Executivos</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Guias estratégicos, relatórios e manuais.</p>
            </div>
          </div>

          {/* Card 3: Planilhas & Cálculos */}
          <div 
            onClick={() => setSelectedCategory('spreadsheet')}
            className={`glass-panel p-5 cursor-pointer flex gap-4 items-start transition-all duration-200 ${
              selectedCategory === 'spreadsheet' 
                ? 'border-[#C1FF07]/30 bg-[#C1FF07]/5 shadow-[0_0_15px_rgba(193,255,7,0.05)]' 
                : 'hover:bg-white/5'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-white/5 text-[#C1FF07]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1 font-outfit">Planilhas & Cálculos</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Modelos de viabilidade e simuladores de valuation.</p>
            </div>
          </div>

          {/* Card 4: Templates Prontos */}
          <div 
            onClick={() => setSelectedCategory('presentation')}
            className={`glass-panel p-5 cursor-pointer flex gap-4 items-start transition-all duration-200 ${
              selectedCategory === 'presentation' 
                ? 'border-[#C1FF07]/30 bg-[#C1FF07]/5 shadow-[0_0_15px_rgba(193,255,7,0.05)]' 
                : 'hover:bg-white/5'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-white/5 text-[#C1FF07]">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1 font-outfit">Templates Prontos</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Apresentações executivas e propostas comerciais.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions drawer (Visible to Admin when rows are checked) */}
      {isAdmin && selectedIds.size > 0 && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '16px 24px', 
            marginBottom: '20px', 
            background: 'rgba(193, 255, 7, 0.04)', 
            borderColor: 'rgba(193, 255, 7, 0.15)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
            {selectedIds.size} recurso(s) selecionado(s)
          </span>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleBulkReleaseNow} 
              className="btn-secondary text-xs"
              style={{ borderColor: 'var(--color-primary-lemon)', color: 'var(--color-primary-lemon)' }}
            >
              <Eye size={14} />
              <span>Liberar Imediatamente</span>
            </button>
            <button 
              onClick={handleBulkDelete} 
              className="btn-secondary text-xs border-red-500/20 text-red-500 hover:border-red-500 hover:bg-red-500/10"
            >
              <Trash2 size={14} />
              <span>Excluir Selecionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Resources Table / Grid */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
        {filteredResources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Nenhum recurso encontrado para os filtros ativos.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(193, 255, 7, 0.1)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {isAdmin && (
                  <th style={{ padding: '15px 12px', width: '45px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === filteredResources.length && filteredResources.length > 0} 
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th style={{ padding: '15px 12px' }}>Nome do Material</th>
                <th style={{ padding: '15px 12px' }}>Descrição</th>
                <th style={{ padding: '15px 12px' }}>Categoria / Formato</th>
                {isAdmin && <th style={{ padding: '15px 12px' }}>Data de Liberação</th>}
                <th style={{ padding: '15px 12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(res => {
                const isSelected = selectedIds.has(res.id);
                const isScheduledFuture = res.available_at && new Date(res.available_at) > new Date();

                return (
                  <tr 
                    key={res.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: isSelected ? 'rgba(193,255,7,0.02)' : 'transparent',
                      opacity: isScheduledFuture ? 0.7 : 1
                    }}
                  >
                    {isAdmin && (
                      <td style={{ padding: '15px 12px' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelectRow(res.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '15px 12px' }}>
                      <div className="flex items-center gap-3">
                        {getResourceIcon(res.category)}
                        <div>
                          <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{res.title}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, marginTop: '2px' }}>Adicionado em {new Date(res.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {res.description || 'Sem descrição cadastrada.'}
                    </td>
                    <td style={{ padding: '15px 12px' }}>
                      <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{res.format || 'ZIP'} {res.size ? `• ${res.size}` : ''}</span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '15px 12px', fontSize: '0.8rem' }}>
                        {res.available_at ? (
                          <span style={{ color: isScheduledFuture ? '#FF4A4A' : '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isScheduledFuture ? <EyeOff size={12} /> : <Eye size={12} />}
                            {new Date(res.available_at).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span style={{ color: '#34D399' }}>Imediata</span>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                      <a 
                        href={res.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="outline-btn text-[10px] font-bold tracking-wider uppercase px-3 py-1.5"
                        style={{ textDecoration: 'none' }}
                      >
                        <Download size={12} />
                        <span>Baixar</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="modal-card w-full max-w-[500px] p-8 relative">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Adicionar Novo Recurso</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="outline-btn border-0 p-1 text-gray-400 hover:text-white"
                style={{ minWidth: 'auto' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddResource}>
              <div className="form-group">
                <label className="form-label">Título do Recurso *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Planilha de Custos Operacionais"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Breve descrição sobre a utilidade do arquivo"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL do Arquivo (Simulado) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: /resources/modelo.xlsx"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  A extensão da URL determina a categoria automaticamente (.xlsx, .pdf, .pptx, etc.)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Vincular à Aula *</label>
                <select 
                  className="form-input"
                  value={newLessonId}
                  onChange={(e) => setNewLessonId(e.target.value)}
                  required
                  style={{ background: 'rgba(1,1,5,0.95)' }}
                >
                  <option value="">Selecione uma aula...</option>
                  {lessons.map(les => (
                    <option key={les.id} value={les.id}>{les.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Agendar Liberação (Opcional)</label>
                <input 
                  type="datetime-local" 
                  className="form-input"
                  value={newAvailableAt}
                  onChange={(e) => setNewAvailableAt(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Deixe em branco para liberação imediata.
                </span>
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full mt-3"
              >
                Cadastrar Recurso
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
