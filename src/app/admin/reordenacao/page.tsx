'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Move, 
  ChevronRight, 
  Layers, 
  BookOpen, 
  Edit2, 
  Save, 
  Check, 
  FileEdit,
  ArrowRight,
  Clock,
  User,
  Plus,
  Paperclip,
  Trash2,
  X
} from 'lucide-react';
import { Course, Module, Lesson, Resource } from '@/lib/db';

export default function ReordenacaoAdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Drag and Drop State
  const [draggingType, setDraggingType] = useState<'module' | 'lesson' | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingSourceModuleId, setDraggingSourceModuleId] = useState<string | null>(null);

  // Modals UI state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeModuleForLesson, setActiveModuleForLesson] = useState<string | null>(null);
  const [newLessonData, setNewLessonData] = useState({ title: '', duration: '', video_url: '', instructor_name: '' });

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activeLessonForResource, setActiveLessonForResource] = useState<string | null>(null);
  const [lessonResources, setLessonResources] = useState<Resource[]>([]);
  const [newResourceData, setNewResourceData] = useState({ title: '', file_url: '', category: 'other' as const });

  const loadData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setCourses(db.courses || []);
        
        if (db.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(db.courses[0].id);
        }

        if (selectedCourseId) {
          // Filter modules
          const rawModules = db.modules.filter((m: Module) => m.course_id === selectedCourseId)
            .sort((a: Module, b: Module) => a.sequence_order - b.sequence_order);
          setModules(rawModules);

          // Filter lessons
          const lessonsMap: Record<string, Lesson[]> = {};
          rawModules.forEach((m: Module) => {
            const rawLessons = db.lessons.filter((l: Lesson) => l.module_id === m.id)
              .sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order);
            lessonsMap[m.id] = rawLessons;
          });
          setLessonsByModule(lessonsMap);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedCourseId]);

  // Rename handle (on Enter key or on Blur)
  const handleRenameSave = async (id: string, type: 'module' | 'lesson') => {
    if (!editingText.trim()) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        if (type === 'module') {
          db.modules = db.modules.map((m: Module) => 
            m.id === id ? { ...m, title: editingText.trim() } : m
          );
        } else {
          db.lessons = db.lessons.map((l: Lesson) => 
            l.id === id ? { ...l, title: editingText.trim() } : l
          );
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setEditingId(null);
        setEditingText('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Content Creation Handlers
  const handleCreateModule = async () => {
    if (!newModuleTitle.trim() || !selectedCourseId) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const courseModules = db.modules.filter((m: Module) => m.course_id === selectedCourseId);
        const nextOrder = courseModules.length;

        const novoModulo: Module = {
          id: crypto.randomUUID(),
          course_id: selectedCourseId,
          title: newModuleTitle.trim(),
          description: newModuleDesc.trim(),
          slug: newModuleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: 'published',
          sequence_order: nextOrder,
          created_at: new Date().toISOString()
        };

        db.modules.push(novoModulo);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setShowModuleModal(false);
        setNewModuleTitle('');
        setNewModuleDesc('');
        loadData();
      }
    } catch(e) { console.error(e); }
  };

  const handleCreateLesson = async () => {
    if (!newLessonData.title.trim() || !activeModuleForLesson) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const moduleLessons = db.lessons.filter((l: Lesson) => l.module_id === activeModuleForLesson);
        const nextOrder = moduleLessons.length;

        const novaAula: Lesson = {
          id: crypto.randomUUID(),
          module_id: activeModuleForLesson,
          title: newLessonData.title.trim(),
          duration: newLessonData.duration || '00:00',
          video_url: newLessonData.video_url,
          instructor_name: newLessonData.instructor_name,
          slug: newLessonData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: 'published',
          sequence_order: nextOrder,
          created_at: new Date().toISOString()
        };

        db.lessons.push(novaAula);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setShowLessonModal(false);
        setActiveModuleForLesson(null);
        setNewLessonData({ title: '', duration: '', video_url: '', instructor_name: '' });
        loadData();
      }
    } catch(e) { console.error(e); }
  };

  const openResourceModal = async (lessonId: string) => {
    setActiveLessonForResource(lessonId);
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        const resList = (db.resources || []).filter((r: Resource) => r.lesson_id === lessonId);
        setLessonResources(resList);
        setShowResourceModal(true);
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateResource = async () => {
    if (!newResourceData.title.trim() || !newResourceData.file_url.trim() || !activeLessonForResource) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const novoRecurso: Resource = {
          id: crypto.randomUUID(),
          lesson_id: activeLessonForResource,
          title: newResourceData.title.trim(),
          file_url: newResourceData.file_url.trim(),
          category: newResourceData.category,
          created_at: new Date().toISOString()
        };

        if(!db.resources) db.resources = [];
        db.resources.push(novoRecurso);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setLessonResources([...lessonResources, novoRecurso]);
        setNewResourceData({ title: '', file_url: '', category: 'other' });
      }
    } catch(e) { console.error(e); }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        db.resources = (db.resources || []).filter((r: Resource) => r.id !== id);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setLessonResources(lessonResources.filter(r => r.id !== id));
      }
    } catch(e) { console.error(e); }
  };

  // Drag Modules Handlers
  const handleModuleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingType('module');
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleModuleDragOver = (e: React.DragEvent) => {
    if (draggingType === 'module') {
      e.preventDefault(); // allow drop
    }
  };

  const handleModuleDrop = async (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault();
    if (draggingType !== 'module' || draggingId === targetModuleId) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        // Find index of modules
        const activeModules = db.modules.filter((m: Module) => m.course_id === selectedCourseId)
          .sort((a: Module, b: Module) => a.sequence_order - b.sequence_order);

        const dragIdx = activeModules.findIndex((m: Module) => m.id === draggingId);
        const dropIdx = activeModules.findIndex((m: Module) => m.id === targetModuleId);

        if (dragIdx > -1 && dropIdx > -1) {
          const [draggedItem] = activeModules.splice(dragIdx, 1);
          activeModules.splice(dropIdx, 0, draggedItem);
          
          // Re-assign sequence order index
          activeModules.forEach((m: Module, idx: number) => {
            m.sequence_order = idx;
          });

          // merge back to full list
          db.modules = db.modules.map((m: Module) => {
            const updated = activeModules.find((up: Module) => up.id === m.id);
            return updated || m;
          });

          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });

          loadData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDraggingType(null);
      setDraggingId(null);
    }
  };

  // Drag Lessons Handlers (Can move inside module or move between modules)
  const handleLessonDragStart = (e: React.DragEvent, lessonId: string, sourceModuleId: string) => {
    setDraggingType('lesson');
    setDraggingId(lessonId);
    setDraggingSourceModuleId(sourceModuleId);
    e.dataTransfer.setData('text/plain', lessonId);
  };

  const handleLessonDragOver = (e: React.DragEvent) => {
    if (draggingType === 'lesson') {
      e.preventDefault();
    }
  };

  const handleLessonDrop = async (e: React.DragEvent, targetModuleId: string, targetLessonId?: string) => {
    e.preventDefault();
    if (draggingType !== 'lesson' || !draggingId) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();

        // 1. Get lessons of target module
        const targetLessons = db.lessons.filter((l: Lesson) => l.module_id === targetModuleId)
          .sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order);

        // 2. Remove dragged lesson from source
        const draggedLesson = db.lessons.find((l: Lesson) => l.id === draggingId);
        if (!draggedLesson) return;

        // update its module pointer if moved between modules
        draggedLesson.module_id = targetModuleId;

        // 3. Insert into target list at correct spot
        let targetIdx = targetLessons.length;
        if (targetLessonId) {
          targetIdx = targetLessons.findIndex((l: Lesson) => l.id === targetLessonId);
        }

        // remove from targetLessons if already in it (reorder)
        const cleanTargetLessons = targetLessons.filter((l: Lesson) => l.id !== draggingId);
        cleanTargetLessons.splice(targetIdx, 0, draggedLesson);

        // 4. Update sequence order numbers
        cleanTargetLessons.forEach((l: Lesson, idx: number) => {
          l.sequence_order = idx;
        });

        // 5. Update global db lessons array
        db.lessons = db.lessons.map((l: Lesson) => {
          if (l.id === draggingId) {
            return draggedLesson;
          }
          const inTarget = cleanTargetLessons.find((cl: Lesson) => cl.id === l.id);
          return inTarget || l;
        });

        // Also sort source lessons if we moved between modules
        if (draggingSourceModuleId !== targetModuleId) {
          const sourceLessons = db.lessons.filter((l: Lesson) => l.module_id === draggingSourceModuleId)
            .sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order);
          
          sourceLessons.forEach((l: Lesson, idx: number) => {
            l.sequence_order = idx;
          });

          db.lessons = db.lessons.map((l: Lesson) => {
            const inSource = sourceLessons.find((sl: Lesson) => sl.id === l.id);
            return inSource || l;
          });
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDraggingType(null);
      setDraggingId(null);
      setDraggingSourceModuleId(null);
    }
  };

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingText(currentTitle);
  };

  return (
    <div>
      {/* Header */}
      <h1 className="page-title">Gerenciador de Conteúdo</h1>
      <p className="page-subtitle">Acesso restrito para administradores. Crie módulos, aulas e recursos. Arraste e solte para ordenar. Clique duas vezes no título para renomear.</p>

      {/* Course selector & Module Creation */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flexGrow: 1, maxWidth: '400px' }}>
            <label className="form-label">Selecione a Masterclass / Curso</label>
            <select 
              className="form-input"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ background: 'rgba(1,1,5,0.95)' }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setShowModuleModal(true)}
            disabled={!selectedCourseId}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Novo Módulo
          </button>
        </div>
      </section>

      {modules.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Nenhum módulo cadastrado nesta masterclass.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {modules.map((m, mIdx) => {
            const moduleLessons = lessonsByModule[m.id] || [];
            
            // Section 4.1 Physical conflicts: Disable dragging module if we are dragging a lesson
            const isModuleDraggable = draggingType !== 'lesson';

            return (
              <div 
                key={m.id}
                draggable={isModuleDraggable}
                onDragStart={(e) => handleModuleDragStart(e, m.id)}
                onDragOver={handleModuleDragOver}
                onDrop={(e) => handleModuleDrop(e, m.id)}
                className="glass-panel"
                style={{
                  padding: '24px',
                  background: draggingId === m.id ? 'rgba(193,255,7,0.02)' : 'var(--bg-card)',
                  border: draggingId === m.id ? '1px dashed var(--color-primary-lemon)' : '1px solid rgba(193, 255, 7, 0.1)',
                  cursor: isModuleDraggable ? 'grab' : 'default'
                }}
              >
                {/* Module Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                    <div style={{ color: 'var(--color-primary-lemon)' }}><Move size={16} /></div>
                    
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Módulo {mIdx + 1}:</span>
                    
                    {/* Inline Rename input vs DoubleClick Text */}
                    {editingId === m.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1 }}>
                        <input 
                          type="text" 
                          className="form-input text-sm"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleRenameSave(m.id, 'module')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSave(m.id, 'module');
                          }}
                          autoFocus
                          style={{ padding: '6px 12px', width: '300px' }}
                        />
                        <button onClick={() => handleRenameSave(m.id, 'module')} className="outline-btn p-1 border-0" style={{ minWidth: 'auto' }}>
                          <Check size={16} className="text-green-400" />
                        </button>
                      </div>
                    ) : (
                      <h3 
                        onDoubleClick={() => startRename(m.id, m.title)}
                        style={{ fontSize: '1.15rem', color: '#fff', margin: 0, cursor: 'text' }}
                        title="Clique duas vezes para renomear"
                      >
                        {m.title}
                      </h3>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Módulo</span>
                    <button 
                      onClick={() => { setActiveModuleForLesson(m.id); setShowLessonModal(true); }}
                      className="outline-btn text-xs py-1 px-2"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Plus size={14} /> Aula
                    </button>
                  </div>
                </div>

                {/* Lessons list inside Module */}
                <div 
                  onDragOver={handleLessonDragOver}
                  onDrop={(e) => handleLessonDrop(e, m.id)}
                  style={{
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '16px',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {moduleLessons.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                      Arraste aulas aqui ou crie aulas no módulo.
                    </div>
                  ) : (
                    moduleLessons.map(lesson => (
                      <div 
                        key={lesson.id}
                        draggable={true}
                        onDragStart={(e) => handleLessonDragStart(e, lesson.id, m.id)}
                        onDragOver={handleLessonDragOver}
                        onDrop={(e) => {
                          e.stopPropagation(); // prevent dropping over parent module drop area
                          handleLessonDrop(e, m.id, lesson.id);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 16px',
                          background: draggingId === lesson.id ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                          border: draggingId === lesson.id ? '1px dashed var(--color-primary-lemon)' : '1px solid rgba(255,255,255,0.04)',
                          borderRadius: '6px',
                          cursor: 'grab'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                          <div style={{ color: 'var(--text-muted)' }}><Move size={14} /></div>
                          
                          {/* Inline Rename input vs DoubleClick Text for Lesson */}
                          {editingId === lesson.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1 }}>
                              <input 
                                type="text" 
                                className="form-input text-xs"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onBlur={() => handleRenameSave(lesson.id, 'lesson')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSave(lesson.id, 'lesson');
                                }}
                                autoFocus
                                style={{ padding: '4px 8px', width: '250px' }}
                              />
                              <button onClick={() => handleRenameSave(lesson.id, 'lesson')} className="outline-btn p-1 border-0" style={{ minWidth: 'auto' }}>
                                <Check size={14} className="text-green-400" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              onDoubleClick={() => startRename(lesson.id, lesson.title)}
                              style={{ color: '#fff', fontSize: '0.85rem', cursor: 'text' }}
                              title="Clique duas vezes para renomear"
                            >
                              {lesson.title}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                          <span className="flex items-center gap-1"><Clock size={12} /> {lesson.duration}</span>
                          <span className="flex items-center gap-1"><User size={12} /> {lesson.instructor_name || 'N/A'}</span>
                          <button 
                            onClick={() => openResourceModal(lesson.id)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors text-white"
                            title="Gerenciar Recursos"
                          >
                            <Paperclip size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12131a] border border-white/10 p-6 rounded-lg max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-outfit font-bold text-white mb-4">Novo Módulo</h3>
            <div className="flex flex-col gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Título do Módulo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newModuleTitle} 
                  onChange={e => setNewModuleTitle(e.target.value)} 
                  placeholder="Ex: Introdução ao Mercado"
                  autoFocus
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Descrição (Opcional)</label>
                <textarea 
                  className="form-input" 
                  value={newModuleDesc} 
                  onChange={e => setNewModuleDesc(e.target.value)} 
                  placeholder="Descreva o que será ensinado neste módulo..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModuleModal(false)} className="outline-btn text-sm">Cancelar</button>
              <button onClick={handleCreateModule} className="btn-primary text-sm">Salvar Módulo</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12131a] border border-white/10 p-6 rounded-lg max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-outfit font-bold text-white mb-4">Nova Aula</h3>
            <div className="flex flex-col gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Título da Aula</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newLessonData.title} 
                  onChange={e => setNewLessonData({...newLessonData, title: e.target.value})} 
                  placeholder="Ex: Aula 1 - O Mindset Vencedor"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Duração</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newLessonData.duration} 
                    onChange={e => setNewLessonData({...newLessonData, duration: e.target.value})} 
                    placeholder="Ex: 15:30"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Nome do Instrutor</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newLessonData.instructor_name} 
                    onChange={e => setNewLessonData({...newLessonData, instructor_name: e.target.value})} 
                    placeholder="Ex: João Silva"
                  />
                </div>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">URL do Vídeo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newLessonData.video_url} 
                  onChange={e => setNewLessonData({...newLessonData, video_url: e.target.value})} 
                  placeholder="https://vimeo.com/..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowLessonModal(false)} className="outline-btn text-sm">Cancelar</button>
              <button onClick={handleCreateLesson} className="btn-primary text-sm">Salvar Aula</button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12131a] border border-white/10 rounded-lg max-w-2xl w-full flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-outfit font-bold text-white flex items-center gap-2"><Paperclip size={20}/> Recursos da Aula</h3>
              <button onClick={() => setShowResourceModal(false)} className="text-white/50 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6">
              {/* Add form */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Adicionar Novo Recurso</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Título / Nome</label>
                    <input 
                      type="text" 
                      className="form-input text-sm" 
                      value={newResourceData.title} 
                      onChange={e => setNewResourceData({...newResourceData, title: e.target.value})} 
                      placeholder="Ex: Planilha de Apoio"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Tipo</label>
                    <select 
                      className="form-input text-sm bg-[#12131a]" 
                      value={newResourceData.category}
                      onChange={e => setNewResourceData({...newResourceData, category: e.target.value as any})}
                    >
                      <option value="document">Documento (PDF/Doc)</option>
                      <option value="spreadsheet">Planilha</option>
                      <option value="presentation">Apresentação</option>
                      <option value="other">Outro Link</option>
                    </select>
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs">URL / Link do Arquivo</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="form-input text-sm flex-grow" 
                      value={newResourceData.file_url} 
                      onChange={e => setNewResourceData({...newResourceData, file_url: e.target.value})} 
                      placeholder="https://..."
                    />
                    <button onClick={handleCreateResource} className="btn-primary text-sm whitespace-nowrap">Adicionar</button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Recursos Atuais ({lessonResources.length})</h4>
                {lessonResources.length === 0 ? (
                  <div className="text-sm text-white/50 text-center p-4 border border-white/5 rounded-lg border-dashed">
                    Nenhum recurso cadastrado nesta aula.
                  </div>
                ) : (
                  lessonResources.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{r.title}</span>
                        <span className="text-xs text-white/40">{r.category === 'document' ? 'Documento' : r.category === 'spreadsheet' ? 'Planilha' : r.category === 'presentation' ? 'Apresentação' : 'Outro'} • <a href={r.file_url} target="_blank" className="hover:underline">{r.file_url}</a></span>
                      </div>
                      <button onClick={() => handleDeleteResource(r.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors" title="Excluir recurso">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
