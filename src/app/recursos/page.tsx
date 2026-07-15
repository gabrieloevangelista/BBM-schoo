'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Square,
  Video,
  Database
} from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';
import { customConfirm, customAlert } from '@/components/CustomConfirm';
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
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit m-0">Recursos</h1>
          <p className="text-text-secondary text-sm m-0 mt-1">Materiais de apoio e downloads.</p>
        </div>
        
        {isAdmin && (
          <Link 
            href="/recursos/novo" 
            className="px-4 py-2 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep rounded-lg text-xs font-bold hover:shadow-[0_0_12px_rgba(193,255,7,0.2)] cursor-pointer transition-all duration-200 flex items-center gap-1.5 font-outfit no-underline"
          >
            <Plus size={16} />
            <span>Adicionar Recurso</span>
          </Link>
        )}
      </div>

      {/* Search and Category Cards */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Search */}
        <div className="relative max-w-md">
          <input 
            type="text" 
            className="form-input pr-4 py-2.5 text-xs w-full" 
            style={{ paddingLeft: '40px' }}
            placeholder="Pesquisar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="absolute left-3.5 top-3 text-text-muted pointer-events-none" />
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
              <h4 className="text-xs font-bold mb-1 font-outfit">Todos</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Visão geral.</p>
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
              <h4 className="text-xs font-bold mb-1 font-outfit">Documentos</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">PDFs e textos.</p>
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
              <h4 className="text-xs font-bold mb-1 font-outfit">Planilhas</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Excel e CSV.</p>
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
              <h4 className="text-xs font-bold mb-1 font-outfit">Apresentações</h4>
              <p className="text-[10px] text-text-secondary m-0 leading-normal">Slides e PPTs.</p>
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
            background: 'rgba(90, 146, 0, 0.04)', 
            borderColor: 'rgba(90, 146, 0, 0.15)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}
        >
          <span className="text-text-base text-sm font-semibold">
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
      <div>
        {filteredResources.length === 0 ? (
          <div className="glass-panel text-center py-10 text-text-secondary">
            Nenhum recurso encontrado para os filtros ativos.
          </div>
        ) : (
          <>
            {/* Mobile Card List View */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredResources.map(res => {
                const isSelected = selectedIds.has(res.id);
                const isScheduledFuture = res.available_at && new Date(res.available_at) > new Date();

                return (
                  <div 
                    key={res.id} 
                    className={`glass-panel p-4 flex flex-col gap-3 border transition-colors ${
                      isSelected 
                        ? 'border-primary-lemon/40 bg-primary-lemon/5' 
                        : 'border-white/5 bg-white/1 hover:bg-white/2'
                    }`}
                    style={{ opacity: isScheduledFuture ? 0.7 : 1 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                          {getResourceIcon(res.category)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-base m-0 leading-snug">{res.title}</h4>
                          <span className="text-[10px] text-text-muted mt-1 block">
                            Adicionado em {new Date(res.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelectRow(res.id)}
                          className="w-4 h-4 cursor-pointer accent-primary-lemon mt-1"
                        />
                      )}
                    </div>
                    
                    {res.description && (
                      <p className="text-xs text-text-secondary m-0 leading-relaxed">
                        {res.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center gap-2 pt-3 border-t border-[var(--color-glass-border)]">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-gray text-[9px]">{res.format || 'ZIP'} {res.size ? `• ${res.size}` : ''}</span>
                        {isAdmin && (
                          <span className="text-[10px] font-medium" style={{ color: isScheduledFuture ? '#FF4A4A' : '#34D399' }}>
                            {res.available_at ? new Date(res.available_at).toLocaleDateString('pt-BR') : 'Imediata'}
                          </span>
                        )}
                      </div>
                      <a 
                        href={res.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-primary py-1.5 px-3 text-[10px] uppercase font-bold tracking-wider no-underline"
                      >
                        <Download size={10} />
                        <span>Baixar</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
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
                              <p className="text-text-base text-sm font-semibold m-0">{res.title}</p>
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
            </div>
          </>
        )}
      </div>

    </div>
  );
}
