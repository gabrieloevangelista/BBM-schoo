'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, Users, MessageSquare, UserPlus, Box,
  Edit2, Trash2, ChevronDown, ChevronUp, Image as ImageIcon,
  Play, Plus, ArrowLeft, GripVertical, Check, Video, Paperclip, X,
  Minimize2, Search, Filter, AlertTriangle, Upload
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Switch from '@/components/Switch';

// Types
interface Course { id: string; title: string; slug: string; description: string; is_published?: boolean; cover_image_url?: string; }
interface Module { id: string; course_id: string; title: string; description?: string; is_published?: boolean; cover_image_url?: string; }
interface Lesson { id: string; module_id: string; title: string; duration: string; instructor_name: string; video_url: string; cover_image_url: string; sequence_order: number; is_published?: boolean; status?: 'published'|'rascunho'|'agendado'; scheduled_at?: string; description?: string; }
interface Resource { id: string; lesson_id: string; title: string; category: string; file_url: string; }

type ViewType = 'masterclasses' | 'modules' | 'lesson' | 'editCourse' | 'editModule';

// Reusable styled input
const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputClass = "bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-md p-3 text-sm text-text-base focus:border-[var(--color-input-border-focus)] outline-none transition-colors w-full";
const selectClass = "bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-md p-3 w-full text-sm text-text-base appearance-none outline-none";

const CustomDateTimePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const parseValue = (val: string) => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const d = parseValue(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const handleChange = (type: 'day'|'month'|'year'|'hours'|'minutes', val: string) => {
    let newD = day, newM = month, newY = year, newH = hours, newMin = minutes;
    if (type === 'day') newD = val;
    if (type === 'month') newM = val;
    if (type === 'year') newY = val;
    if (type === 'hours') newH = val;
    if (type === 'minutes') newMin = val;
    
    onChange(`${newY}-${newM}-${newD}T${newH}:${newMin}:00`);
  };

  return (
    <>
      <div className="md:hidden">
        <input 
          type="datetime-local" 
          className={inputClass} 
          value={value ? value.slice(0, 16) : ''} 
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="hidden md:flex items-center gap-2">
        <div className="flex gap-1">
          <select className={`${selectClass} px-2 py-2 min-w-[60px]`} value={day} onChange={e => handleChange('day', e.target.value)}>
            {Array.from({length: 31}, (_, i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}
          </select>
          <span className="text-text-secondary self-center">/</span>
          <select className={`${selectClass} px-2 py-2 min-w-[60px]`} value={month} onChange={e => handleChange('month', e.target.value)}>
            {Array.from({length: 12}, (_, i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}
          </select>
          <span className="text-text-secondary self-center">/</span>
          <select className={`${selectClass} px-2 py-2 min-w-[80px]`} value={year} onChange={e => handleChange('year', e.target.value)}>
            {Array.from({length: 5}, (_, i) => <option key={i} value={String(new Date().getFullYear() + i)}>{new Date().getFullYear() + i}</option>)}
          </select>
        </div>
        <span className="text-text-secondary text-xs uppercase font-bold mx-1">às</span>
        <div className="flex gap-1">
          <select className={`${selectClass} px-2 py-2 min-w-[60px]`} value={hours} onChange={e => handleChange('hours', e.target.value)}>
            {Array.from({length: 24}, (_, i) => <option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}
          </select>
          <span className="text-text-secondary self-center">:</span>
          <select className={`${selectClass} px-2 py-2 min-w-[60px]`} value={minutes} onChange={e => handleChange('minutes', e.target.value)}>
            {Array.from({length: 60}, (_, i) => <option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}
          </select>
        </div>
      </div>
    </>
  );
};

export default function AdminContentManager() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // Views
  const [view, setView] = useState<ViewType>('masterclasses');
  
  // Selections
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Custom Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{message: string; onConfirm: () => void} | null>(null);

  // Form states for course editor
  const [courseForm, setCourseForm] = useState({ title: '', description: '', cover_image_url: '' });
  const [courseEditId, setCourseEditId] = useState<string | null>(null);

  // Form states for module editor
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', cover_image_url: '' });
  const [moduleEditId, setModuleEditId] = useState<string | null>(null);
  
  // Form states for lesson editor
  const [lessonForm, setLessonForm] = useState<Lesson>({ id: '', module_id: '', title: '', duration: '', instructor_name: '', video_url: '', cover_image_url: '', sequence_order: 0, is_published: false, status: 'rascunho', scheduled_at: '', description: '' });

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState<{id: string, type: 'course'|'module'|'lesson', title: string} | null>(null);

  // Drag and drop state
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        setModules(data.modules || []);
        setLessons((data.lessons || []).sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order));
        setResources(data.resources || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveDb = async (newData: any) => {
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || (user.member_type !== 'admin' && user.member_type !== 'mentor')) {
    return <div className="p-10 text-center">Acesso Negado. Você precisa ser administrador ou mentor.</div>;
  }

  // --- Custom Confirm Dialog ---
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  // --- Handlers ---
  const handleDeleteCourse = (id: string) => {
    showConfirm('Deseja excluir esta masterclass e todo o seu conteúdo?', async () => {
      const db = await (await fetch('/api/db')).json();
      db.courses = db.courses.filter((c: Course) => c.id !== id);
      db.modules = db.modules.filter((m: Module) => m.course_id !== id);
      const moduleIds = modules.filter(m => m.course_id === id).map(m => m.id);
      db.lessons = db.lessons.filter((l: Lesson) => !moduleIds.includes(l.module_id));
      await saveDb(db);
      setConfirmDialog(null);
    });
  };

  const handleDeleteModule = (id: string) => {
    showConfirm('Deseja excluir este módulo e todas as suas aulas?', async () => {
      const db = await (await fetch('/api/db')).json();
      db.modules = db.modules.filter((m: Module) => m.id !== id);
      db.lessons = db.lessons.filter((l: Lesson) => l.module_id !== id);
      await saveDb(db);
      setConfirmDialog(null);
    });
  };

  const handleDeleteLesson = (id: string) => {
    showConfirm('Deseja excluir esta aula?', async () => {
      const db = await (await fetch('/api/db')).json();
      db.lessons = db.lessons.filter((l: Lesson) => l.id !== id);
      await saveDb(db);
      setConfirmDialog(null);
    });
  };

  const handleSaveCourse = async () => {
    const db = await (await fetch('/api/db')).json();
    if (courseEditId) {
      const idx = db.courses.findIndex((c: Course) => c.id === courseEditId);
      if (idx > -1) {
        db.courses[idx] = { ...db.courses[idx], ...courseForm, slug: courseForm.title.toLowerCase().replace(/\s+/g, '-') };
      }
    } else {
      db.courses.push({
        id: crypto.randomUUID(),
        ...courseForm,
        slug: courseForm.title.toLowerCase().replace(/\s+/g, '-'),
        is_published: false
      });
    }
    await saveDb(db);
    setView('masterclasses');
  };

  const handleSaveModule = async () => {
    if (!selectedCourse) return;
    const db = await (await fetch('/api/db')).json();
    if (moduleEditId) {
      const idx = db.modules.findIndex((m: Module) => m.id === moduleEditId);
      if (idx > -1) {
        db.modules[idx] = { ...db.modules[idx], ...moduleForm };
      }
    } else {
      db.modules.push({
        id: crypto.randomUUID(),
        course_id: selectedCourse.id,
        ...moduleForm,
        is_published: false
      });
    }
    await saveDb(db);
    setView('modules');
  };

  const handleSaveLesson = async () => {
    const db = await (await fetch('/api/db')).json();
    const existingIdx = db.lessons.findIndex((l: Lesson) => l.id === lessonForm.id);
    if (existingIdx > -1) {
      db.lessons[existingIdx] = lessonForm;
    } else {
      db.lessons.push(lessonForm);
    }
    await saveDb(db);
    setView('modules');
  };

  const saveInlineTitle = async () => {
    if (!editingTitle) return;
    const db = await (await fetch('/api/db')).json();
    if (editingTitle.type === 'course') {
      const idx = db.courses.findIndex((c: Course) => c.id === editingTitle.id);
      if (idx > -1) db.courses[idx].title = editingTitle.title;
    } else if (editingTitle.type === 'module') {
      const idx = db.modules.findIndex((m: Module) => m.id === editingTitle.id);
      if (idx > -1) db.modules[idx].title = editingTitle.title;
    } else if (editingTitle.type === 'lesson') {
      const idx = db.lessons.findIndex((l: Lesson) => l.id === editingTitle.id);
      if (idx > -1) db.lessons[idx].title = editingTitle.title;
    }
    await saveDb(db);
    setEditingTitle(null);
  };

  const handleDropModule = async (targetModuleId: string) => {
    if (!draggedModule || draggedModule === targetModuleId || !selectedCourse) return;
    const db = await (await fetch('/api/db')).json();
    const courseModules = db.modules.filter((m: Module) => m.course_id === selectedCourse.id);
    courseModules.sort((a: Module, b: Module) => (a.sequence_order || 0) - (b.sequence_order || 0));
    const sourceIdx = courseModules.findIndex((m: Module) => m.id === draggedModule);
    const targetIdx = courseModules.findIndex((m: Module) => m.id === targetModuleId);
    
    if (sourceIdx > -1 && targetIdx > -1) {
      const draggedObj = courseModules[sourceIdx];
      courseModules.splice(sourceIdx, 1);
      courseModules.splice(targetIdx, 0, draggedObj);
      courseModules.forEach((m: Module, idx: number) => {
        m.sequence_order = idx;
        const globalIdx = db.modules.findIndex((g: Module) => g.id === m.id);
        if (globalIdx > -1) db.modules[globalIdx] = m;
      });
      await saveDb(db);
    }
    setDraggedModule(null);
  };

  const handleDropLesson = async (targetLessonId: string, moduleId: string) => {
    if (!draggedLesson || draggedLesson === targetLessonId) return;
    const db = await (await fetch('/api/db')).json();
    const moduleLessons = db.lessons.filter((l: Lesson) => l.module_id === moduleId);
    moduleLessons.sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order);
    const sourceIdx = moduleLessons.findIndex((l: Lesson) => l.id === draggedLesson);
    const targetIdx = moduleLessons.findIndex((l: Lesson) => l.id === targetLessonId);
    
    if (sourceIdx > -1 && targetIdx > -1) {
      const draggedObj = moduleLessons[sourceIdx];
      moduleLessons.splice(sourceIdx, 1);
      moduleLessons.splice(targetIdx, 0, draggedObj);
      moduleLessons.forEach((l: Lesson, idx: number) => {
        l.sequence_order = idx;
        const globalIdx = db.lessons.findIndex((g: Lesson) => g.id === l.id);
        if (globalIdx > -1) db.lessons[globalIdx] = l;
      });
      await saveDb(db);
    }
    setDraggedLesson(null);
  };

  // ============================================================
  // VIEW: Masterclasses Grid
  // ============================================================
  const renderMasterclassesView = () => (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-text-base flex items-center gap-2">Conteúdos (Masterclasses)</h2>
        <button 
          onClick={() => { setCourseEditId(null); setCourseForm({ title: '', description: '', cover_image_url: '' }); setView('editCourse'); }}
          className="btn-primary text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-2"
        >
          <Plus size={16} /> Criar Masterclass
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const courseModules = modules.filter(m => m.course_id === course.id);
          return (
            <div key={course.id} className="glass-panel hover:border-[var(--color-glass-hover-border)] transition-colors flex flex-col gap-4 group overflow-hidden">
              {/* Thumbnail */}
              {course.cover_image_url && (
                <div className="h-36 overflow-hidden -m-[1px] -mt-[1px] rounded-t-[3px]">
                  <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 pt-0 flex flex-col gap-4 flex-grow" style={course.cover_image_url ? {} : { paddingTop: '20px' }}>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-text-base leading-snug">{course.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setCourseEditId(course.id); setCourseForm({ title: course.title, description: course.description, cover_image_url: course.cover_image_url || '' }); setView('editCourse'); }} className="p-1.5 text-text-secondary hover:text-text-base rounded bg-[var(--color-glass-bg)]"><Edit2 size={14}/></button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded bg-red-400/10"><Trash2 size={14}/></button>
                  </div>
                </div>
                
                <p className="text-xs text-text-secondary line-clamp-2">{course.description}</p>
                
                <div className="mt-auto flex justify-between items-center pt-2">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{courseModules.length} módulos</span>
                  <span className="badge badge-lemon text-[9px] px-2 py-0.5 uppercase">Publicado</span>
                </div>
                
                <button 
                  onClick={() => { setSelectedCourse(course); setView('modules'); }}
                  className="w-full mt-2 glass-panel glass-panel-hover text-text-base text-xs font-bold uppercase tracking-wider py-2 rounded transition-colors text-center"
                >
                  Gerenciar Conteúdo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ============================================================
  // VIEW: Edit/Create Course (Full Page)
  // ============================================================
  const renderCourseEditor = () => (
    <div className="flex flex-col gap-6 animate-fade-in max-w-3xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
          <button onClick={() => setView('masterclasses')} className="hover:text-text-base flex items-center gap-1 transition-colors">
            <ArrowLeft size={12} /> VOLTAR
          </button>
          <span>/</span>
          <span>MASTERCLASSES</span>
        </div>
        <h1 className="text-2xl font-extrabold text-text-base">{courseEditId ? 'Editar Masterclass' : 'Nova Masterclass'}</h1>
        <p className="text-xs text-text-secondary">Defina o título, descrição e imagem de capa da masterclass.</p>
      </div>

      <div className="glass-panel p-8 flex flex-col gap-6">
        <FormField label="Título da Masterclass *">
          <input type="text" className={inputClass} value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} placeholder="Ex: Marketing Estratégico de Alta Performance" />
        </FormField>

        <FormField label="Descrição">
          <textarea className={`${inputClass} min-h-[120px] resize-y`} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Uma breve descrição sobre o conteúdo desta masterclass..." />
        </FormField>

        <FormField label="Imagem de Capa (Thumbnail)">
          {courseForm.cover_image_url ? (
            <div className="relative w-full h-[200px] rounded-lg border border-[var(--color-glass-border)] overflow-hidden">
              <img src={courseForm.cover_image_url} alt="Capa" className="w-full h-full object-cover" />
              <button onClick={() => setCourseForm({...courseForm, cover_image_url: ''})} className="absolute top-3 right-3 w-8 h-8 rounded bg-black/60 border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-400/20 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ) : null}
          <label className="mt-2 border border-dashed border-[var(--color-input-border)] rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-[var(--color-glass-hover-bg)] transition-colors cursor-pointer text-text-secondary hover:text-text-base">
            <Upload size={24} />
            <span className="text-xs font-bold">Arraste ou clique para subir a imagem de capa</span>
            <input type="file" className="hidden" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) setCourseForm({...courseForm, cover_image_url: URL.createObjectURL(file)});
            }} />
          </label>
        </FormField>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[var(--color-glass-border)]">
          <button onClick={() => setView('masterclasses')} className="flex-1 glass-panel text-text-base text-xs font-bold uppercase tracking-widest py-4 rounded transition-colors text-center hover:bg-[var(--color-glass-hover-bg)]">
            Cancelar
          </button>
          <button onClick={handleSaveCourse} disabled={!courseForm.title.trim()} className="flex-1 btn-primary text-xs font-bold uppercase tracking-widest py-4 rounded disabled:opacity-40">
            {courseEditId ? 'Salvar Alterações' : 'Criar Masterclass'}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // VIEW: Modules & Lessons Accordion
  // ============================================================
  const renderModulesView = () => {
    if (!selectedCourse) return null;
    const courseModules = modules.filter(m => m.course_id === selectedCourse.id);
    
    return (
      <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center glass-panel p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('masterclasses')} className="text-text-secondary hover:text-text-base p-1 rounded transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-text-base">Módulos da Masterclass</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setModuleEditId(null); setModuleForm({ title: '', description: '', cover_image_url: '' }); setView('editModule'); }}
              className="btn-primary text-xs uppercase tracking-wider px-3 py-1.5 flex items-center gap-2"
            >
              <Plus size={14} /> Criar Módulo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {courseModules.map((module) => {
            const moduleLessons = lessons.filter(l => l.module_id === module.id);
            return (
              <div 
                key={module.id} 
                className={`glass-panel overflow-hidden flex flex-col group/module ${draggedModule === module.id ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => { e.stopPropagation(); setDraggedModule(module.id); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.stopPropagation(); handleDropModule(module.id); }}
              >
                <div className="p-4 flex items-center justify-between border-b border-transparent group-hover/module:border-[var(--color-glass-border)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing"><GripVertical size={16} className="text-text-muted" /></div>
                    {editingTitle?.id === module.id && editingTitle.type === 'module' ? (
                      <input 
                        type="text" 
                        value={editingTitle.title} 
                        onChange={e => setEditingTitle({...editingTitle, title: e.target.value})}
                        onBlur={saveInlineTitle}
                        onKeyDown={e => e.key === 'Enter' && saveInlineTitle()}
                        autoFocus
                        className="bg-transparent border-b border-white/20 text-sm font-bold text-text-base outline-none px-1"
                      />
                    ) : (
                      <h3 
                        className="text-sm font-bold text-text-base m-0 cursor-text"
                        onDoubleClick={() => setEditingTitle({ id: module.id, type: 'module', title: module.title })}
                        title="Clique duas vezes para renomear"
                      >
                        {module.title}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold px-2 py-0.5 rounded border border-green-400/20 bg-green-400/10">Publicado</span>
                    <span className="text-[10px] font-bold text-text-secondary bg-[var(--color-glass-bg)] px-2 py-0.5 rounded">{moduleLessons.length} conteúdos</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setModuleEditId(module.id); setModuleForm({ title: module.title, description: module.description || '', cover_image_url: module.cover_image_url || '' }); setView('editModule'); }} className="p-1.5 text-text-secondary hover:text-text-base rounded hover:bg-[var(--color-glass-hover-bg)] transition-colors"><Edit2 size={14}/></button>
                      <button onClick={() => handleDeleteModule(module.id)} className="p-1.5 text-red-400/70 hover:text-red-400 rounded hover:bg-red-400/10 transition-colors"><Trash2 size={14}/></button>
                    </div>
                    <ChevronUp size={18} className="text-text-secondary ml-2" />
                  </div>
                </div>
                
                <div className="flex flex-col">
                  {moduleLessons.map((lesson, lIdx) => (
                    <div 
                      key={lesson.id} 
                      className={`flex items-center justify-between p-3 px-6 border-t border-[var(--color-glass-border)] hover:bg-[var(--color-glass-hover-bg)] transition-colors group/lesson ${draggedLesson === lesson.id ? 'opacity-50 bg-[var(--color-glass-hover-bg)]' : ''}`}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); setDraggedLesson(lesson.id); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.stopPropagation(); handleDropLesson(lesson.id, module.id); }}
                    >
                      <div className="flex items-center gap-3 pl-6">
                        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover/lesson:opacity-100 transition-opacity"><GripVertical size={14} className="text-text-muted" /></div>
                        {editingTitle?.id === lesson.id && editingTitle.type === 'lesson' ? (
                          <input 
                            type="text" 
                            value={editingTitle.title} 
                            onChange={e => setEditingTitle({...editingTitle, title: e.target.value})}
                            onBlur={saveInlineTitle}
                            onKeyDown={e => e.key === 'Enter' && saveInlineTitle()}
                            autoFocus
                            className="bg-transparent border-b border-white/20 text-xs text-text-base outline-none px-1 flex-1 min-w-[200px]"
                          />
                        ) : (
                          <span 
                            className="text-xs text-text-base cursor-text"
                            onDoubleClick={() => setEditingTitle({ id: lesson.id, type: 'lesson', title: lesson.title })}
                            title="Clique duas vezes para renomear"
                          >
                            {String(lIdx + 1).padStart(2, '0')} - {lesson.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] uppercase tracking-wider text-green-400/70 font-bold">Publicado</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                          <button onClick={() => { setLessonForm(lesson); setView('lesson'); }} className="p-1 text-text-secondary hover:text-text-base rounded hover:bg-[var(--color-glass-hover-bg)]"><Edit2 size={12}/></button>
                          <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1 text-red-400/50 hover:text-red-400 rounded hover:bg-red-400/10"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 px-6 border-t border-[var(--color-glass-border)]">
                    <button 
                      onClick={() => {
                        setLessonForm({ id: crypto.randomUUID(), module_id: module.id, title: '', duration: '', instructor_name: '', video_url: '', cover_image_url: '', sequence_order: moduleLessons.length, is_published: false, status: 'rascunho', scheduled_at: '', description: '' });
                        setView('lesson');
                      }}
                      className="w-6 h-6 rounded-full border border-[var(--color-input-border)] flex items-center justify-center text-text-secondary hover:text-text-base hover:border-text-base transition-all ml-12"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================
  // VIEW: Edit/Create Module (Full Page)
  // ============================================================
  const renderModuleEditor = () => (
    <div className="flex flex-col gap-6 animate-fade-in max-w-3xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
          <button onClick={() => setView('modules')} className="hover:text-text-base flex items-center gap-1 transition-colors">
            <ArrowLeft size={12} /> VOLTAR
          </button>
          <span>/</span>
          <span>MÓDULOS</span>
        </div>
        <h1 className="text-2xl font-extrabold text-text-base">{moduleEditId ? 'Editar Módulo' : 'Novo Módulo'}</h1>
        <p className="text-xs text-text-secondary">Configure título, descrição e thumbnail do módulo.</p>
      </div>

      <div className="glass-panel p-8 flex flex-col gap-6">
        <FormField label="Título do Módulo *">
          <input type="text" className={inputClass} value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} placeholder="Ex: Funis de Vendas e Aquisição de Clientes" />
        </FormField>

        <FormField label="Descrição">
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} placeholder="Breve descrição do conteúdo abordado neste módulo..." />
        </FormField>

        <FormField label="Imagem de Capa (Thumbnail)">
          {moduleForm.cover_image_url ? (
            <div className="relative w-full h-[200px] rounded-lg border border-[var(--color-glass-border)] overflow-hidden">
              <img src={moduleForm.cover_image_url} alt="Capa" className="w-full h-full object-cover" />
              <button onClick={() => setModuleForm({...moduleForm, cover_image_url: ''})} className="absolute top-3 right-3 w-8 h-8 rounded bg-black/60 border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-400/20 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ) : null}
          <label className="mt-2 border border-dashed border-[var(--color-input-border)] rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-[var(--color-glass-hover-bg)] transition-colors cursor-pointer text-text-secondary hover:text-text-base">
            <Upload size={24} />
            <span className="text-xs font-bold">Arraste ou clique para subir a imagem</span>
            <input type="file" className="hidden" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) setModuleForm({...moduleForm, cover_image_url: URL.createObjectURL(file)});
            }} />
          </label>
        </FormField>

        <FormField label="Status de Publicação">
          <div className="relative">
            <select className={selectClass}>
              <option>Publicado</option>
              <option>Rascunho</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </FormField>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[var(--color-glass-border)]">
          <button onClick={() => setView('modules')} className="flex-1 glass-panel text-text-base text-xs font-bold uppercase tracking-widest py-4 rounded transition-colors text-center hover:bg-[var(--color-glass-hover-bg)]">
            Cancelar
          </button>
          <button onClick={handleSaveModule} disabled={!moduleForm.title.trim()} className="flex-1 btn-primary text-xs font-bold uppercase tracking-widest py-4 rounded disabled:opacity-40">
            {moduleEditId ? 'Salvar Alterações' : 'Criar Módulo'}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // VIEW: Lesson Editor (Full Page)
  // ============================================================
  const renderLessonEditor = () => (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
          <button onClick={() => setView('modules')} className="hover:text-text-base flex items-center gap-1 transition-colors">
            <ArrowLeft size={12} /> PAINEL DE CONTROLE
          </button>
          <span>/</span>
          <span>GESTÃO E ESTRUTURAÇÃO</span>
          <span>/</span>
          <span>AULA</span>
        </div>
        <h1 className="text-2xl font-extrabold text-text-base">Administrar Aula</h1>
        <p className="text-xs text-text-secondary">Edite informações básicas, faça upload de vídeos, insira a capa e anexe arquivos de apoio para os alunos.</p>
      </div>

      <div className="glass-panel p-8 flex flex-col gap-6">
        <FormField label="Título da Aula">
          <input type="text" className={inputClass} value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} placeholder="Ex: Introdução" />
        </FormField>

        <FormField label="Descrição / Conteúdo">
          <textarea className={`${inputClass} min-h-[120px] resize-y`} value={lessonForm.description || ''} onChange={e => setLessonForm({...lessonForm, description: e.target.value})} placeholder="Descreva o que será abordado nesta aula..." />
        </FormField>

        <FormField label="Vídeo da Aula">
          <div className="border border-[var(--color-input-border)] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between bg-[var(--color-input-bg)] gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-[#C1FF07]/10 flex items-center justify-center text-[#C1FF07]">
                <Video size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-base">
                  {lessonForm.video_url ? 'Upload Concluído' : 'Nenhum vídeo enviado'}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {lessonForm.video_url ? 'O vídeo está pronto para ser assistido' : 'Suba um arquivo de vídeo do seu dispositivo'}
                </span>
              </div>
            </div>
            <label className="outline-btn text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <Upload size={14} /> Substituir Aula
              <input type="file" className="hidden" accept="video/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) setLessonForm({...lessonForm, video_url: URL.createObjectURL(file)});
              }} />
            </label>
          </div>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-md p-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Ativar Aula</span>
                <span className="text-[10px] text-text-secondary mt-0.5">Disponibilizar aula imediatamente</span>
              </div>
              <Switch 
                checked={lessonForm.status === 'published' || (!lessonForm.status && lessonForm.is_published === true)} 
                onChange={checked => setLessonForm({...lessonForm, status: checked ? 'published' : 'rascunho', is_published: checked})} 
              />
            </div>

            {lessonForm.status !== 'published' && (!lessonForm.status && lessonForm.is_published === true ? false : true) && (
              <div className="flex flex-col gap-2 p-4 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-md animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Agendar Publicação</span>
                  <Switch 
                    checked={lessonForm.status === 'agendado'} 
                    onChange={checked => setLessonForm({...lessonForm, status: checked ? 'agendado' : 'rascunho'})} 
                  />
                </div>
                {lessonForm.status === 'agendado' && (
                  <CustomDateTimePicker 
                    value={lessonForm.scheduled_at || ''} 
                    onChange={val => setLessonForm({...lessonForm, scheduled_at: val})} 
                  />
                )}
              </div>
            )}
          </div>
          
          <FormField label="Instrutor">
            <div className="relative">
              <select className={selectClass} value={lessonForm.instructor_name} onChange={e => setLessonForm({...lessonForm, instructor_name: e.target.value})}>
                <option>Eng. Magno Santos</option>
                <option>Gabriel Evangelista</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </FormField>
        </div>

        <FormField label="Imagem de Capa (Thumbnail)">
          <div className="relative w-full h-[200px] rounded-lg border border-[var(--color-glass-border)] overflow-hidden bg-black/40 group">
            <img src={lessonForm.cover_image_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80'} alt="Capa" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-4xl font-extrabold text-white uppercase tracking-tight">{lessonForm.title || 'INTRODUÇÃO'}</h2>
            </div>
            <button onClick={() => setLessonForm({...lessonForm, cover_image_url: ''})} className="absolute top-4 right-4 w-8 h-8 rounded bg-black/60 border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-400/20 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
          
          <label className="mt-2 border border-dashed border-[var(--color-input-border)] rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-[var(--color-glass-hover-bg)] transition-colors cursor-pointer text-text-secondary hover:text-text-base">
            <ImageIcon size={24} />
            <span className="text-xs font-bold">Arraste ou clique para subir a imagem de capa</span>
            <input type="file" className="hidden" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) setLessonForm({...lessonForm, cover_image_url: URL.createObjectURL(file)});
            }} />
          </label>
        </FormField>

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center border-b border-[var(--color-glass-border)] pb-3">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Recursos Anexados (Arquivos / Planilhas)</label>
            <button className="outline-btn text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 flex items-center gap-1.5">
              <Plus size={12} /> Anexar Novo Recurso
            </button>
          </div>
          <div className="glass-panel p-8 flex items-center justify-center text-xs text-text-secondary">
            Nenhum arquivo ou recurso de apoio anexado a esta aula.
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[var(--color-glass-border)]">
          <button onClick={() => setView('modules')} className="flex-1 glass-panel text-text-base text-xs font-bold uppercase tracking-widest py-4 rounded transition-colors text-center hover:bg-[var(--color-glass-hover-bg)]">
            Cancelar
          </button>
          <button onClick={handleSaveLesson} className="flex-1 btn-primary text-xs font-bold uppercase tracking-widest py-4 rounded">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="flex flex-col w-full">

      <div className="animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary">Carregando conteúdos...</div>
        ) : (
          <>
            {view === 'masterclasses' && renderMasterclassesView()}
            {view === 'editCourse' && renderCourseEditor()}
            {view === 'modules' && renderModulesView()}
            {view === 'editModule' && renderModuleEditor()}
            {view === 'lesson' && renderLessonEditor()}
          </>
        )}
      </div>

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={() => setConfirmDialog(null)}>
          <div className="modal-card max-w-[420px] w-full p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-base">Confirmar Exclusão</h3>
                <p className="text-xs text-text-secondary mt-1">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 glass-panel text-text-base text-xs font-bold uppercase tracking-widest py-3 rounded transition-colors text-center hover:bg-[var(--color-glass-hover-bg)]">
                Cancelar
              </button>
              <button onClick={confirmDialog.onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-3 rounded transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
