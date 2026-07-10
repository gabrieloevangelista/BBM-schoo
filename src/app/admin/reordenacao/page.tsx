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
  User
} from 'lucide-react';
import { Course, Module, Lesson } from '@/lib/db';

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
      <h1 className="page-title">Reordenação de Conteúdo</h1>
      <p className="page-subtitle">Acesso restrito para administradores. Arraste e solte para ordenar módulos e aulas. Clique duas vezes para renomear.</p>

      {/* Course selector */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Selecione a Masterclass para Organizar</label>
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

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Módulo</span>
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

                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1"><Clock size={12} /> {lesson.duration}</span>
                          <span className="flex items-center gap-1"><User size={12} /> {lesson.instructor_name}</span>
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
    </div>
  );
}
