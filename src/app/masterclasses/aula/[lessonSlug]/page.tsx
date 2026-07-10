'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import JSZip from 'jszip';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Download, 
  ArrowLeft, 
  Send,
  MessageSquare,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FileQuestion,
  CornerDownRight,
  Info
} from 'lucide-react';
import { LessonDetailSkeleton } from '@/components/SkeletonLoaders';
import { Lesson, Resource, LessonComment, Course, Module } from '@/lib/db';

export default function LessonDetailPage() {
  const { user } = useAuth();
  const { lessonSlug } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sobre' | 'recursos' | 'comentarios'>('sobre');

  // Video progress refs/states
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastUpdatedProgress = useRef<number>(0);
  const [isWatched, setIsWatched] = useState(false);

  // Comments inputs
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // JSZip download status
  const [zipLoading, setZipLoading] = useState(false);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        const response = await fetch('/api/db');
        if (!response.ok) throw new Error('Failed to load database');
        const db = await response.json();

        // 1. Find lesson
        const foundLesson = db.lessons.find((l: Lesson) => l.slug === lessonSlug);
        if (!foundLesson) {
          router.push('/masterclasses');
          return;
        }

        // Apply time filter if not admin
        const now = new Date();
        if (user?.member_type !== 'admin') {
          if (foundLesson.status !== 'published') {
            if (foundLesson.status === 'agendado') {
              if (!foundLesson.scheduled_at || new Date(foundLesson.scheduled_at) > now) {
                router.push('/masterclasses');
                return;
              }
            } else {
              router.push('/masterclasses');
              return;
            }
          }
        }

        setLesson(foundLesson);

        // 2. Find associated module and course
        const foundModule = db.modules.find((m: Module) => m.id === foundLesson.module_id);
        if (foundModule) {
          setModule(foundModule);
          const foundCourse = db.courses.find((c: Course) => c.id === foundModule.course_id);
          if (foundCourse) {
            setCourse(foundCourse);
          }
        }

        // 3. Find and filter resources
        let rawResources = db.resources.filter((r: Resource) => r.lesson_id === foundLesson.id);
        if (user?.member_type !== 'admin') {
          rawResources = rawResources.filter((r: Resource) => {
            if (!r.available_at) return true;
            return new Date(r.available_at) <= now;
          });
        }
        setResources(rawResources);

        // 4. Load comments for this lesson
        // In database structure lesson_comments has fields. Let's filter by lesson_id
        let rawComments = db.lesson_comments?.filter((c: any) => c.lesson_id === foundLesson.id) || [];
        
        // Let's adapt our mockDb comments: if lesson_comments is empty, let's load/simulate some
        setComments(rawComments);

        // 5. Check if lesson is already marked watched
        const progress = db.user_lesson_progress.find(
          (p: any) => p.user_id === user?.id && p.lesson_id === foundLesson.id
        );
        if (progress && progress.completed) {
          setIsWatched(true);
        }

      } catch (error) {
        console.error('Error loading lesson details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && lessonSlug) {
      fetchLessonData();
    }
  }, [user, lessonSlug, router]);

  // Video progress updater
  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video || !lesson || !user) return;

    const currentSeconds = Math.floor(video.currentTime);
    const totalSeconds = Math.floor(video.duration);

    if (isNaN(totalSeconds) || totalSeconds <= 0) return;

    // Send update every 10 seconds to avoid flooding requests
    if (Math.abs(currentSeconds - lastUpdatedProgress.current) >= 10 || currentSeconds === totalSeconds) {
      lastUpdatedProgress.current = currentSeconds;
      
      const pct = Math.min(100, Math.round((currentSeconds / totalSeconds) * 100));
      const completed = pct >= 90; // Completed status at 90%

      if (completed && !isWatched) {
        setIsWatched(true);
      }

      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const db = await response.json();
          const existingIndex = db.user_lesson_progress.findIndex(
            (p: any) => p.user_id === user.id && p.lesson_id === lesson.id
          );
          
          const newProgress = {
            id: existingIndex > -1 ? db.user_lesson_progress[existingIndex].id : `progress-${Date.now()}`,
            user_id: user.id,
            lesson_id: lesson.id,
            watched_seconds: currentSeconds,
            total_seconds: totalSeconds,
            percent_complete: pct,
            completed: completed || (existingIndex > -1 && db.user_lesson_progress[existingIndex].completed),
            last_watched_at: new Date().toISOString()
          };

          if (existingIndex > -1) {
            db.user_lesson_progress[existingIndex] = newProgress;
          } else {
            db.user_lesson_progress.push(newProgress);
          }

          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
          });
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  // JSZip download handler
  const handleDownloadResources = async () => {
    if (resources.length === 0) return;

    if (resources.length === 1) {
      // 1. Single Resource: Direct Download
      window.open(resources[0].file_url, '_blank');
      return;
    }

    // 2. Multiple Resources: Compile client-side ZIP
    setZipLoading(true);
    const zip = new JSZip();

    try {
      for (const res of resources) {
        try {
          const blob = await fetch(res.file_url).then(r => {
            if (!r.ok) throw new Error('File not found');
            return r.blob();
          });
          const extension = res.format || 'bin';
          zip.file(`${res.title}.${extension}`, blob);
        } catch (fileErr) {
          // Fallback placeholder file if download fails (CORS or offline)
          const ext = res.format || 'txt';
          zip.file(
            `${res.title}.${ext}`, 
            `Este é o conteúdo simulado do arquivo de recurso: ${res.title}.\nLink original: ${res.file_url}\n(Modo offline / fallback local)`
          );
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recursos-${lesson?.slug || 'aula'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (zipErr) {
      console.error('Error generating zip:', zipErr);
      alert('Erro ao compactar arquivos. Experimente baixar um a um.');
    } finally {
      setZipLoading(false);
    }
  };

  // Comments actions
  const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const text = parentId ? replyTexts[parentId] : newCommentText;
    if (!text || !text.trim() || !user || !lesson) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const newComment = {
          id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lesson_id: lesson.id,
          user_id: user.id,
          user_name: user.name,
          user_avatar: user.img || '',
          content: text.trim(),
          parent_id: parentId || null,
          created_at: new Date().toISOString()
        };

        if (!db.lesson_comments) {
          db.lesson_comments = [];
        }
        db.lesson_comments.push(newComment);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // reload local comments state
        const updatedComments = db.lesson_comments.filter((c: any) => c.lesson_id === lesson.id);
        setComments(updatedComments);

        if (parentId) {
          setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
          setActiveReplyBox(null);
        } else {
          setNewCommentText('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Deseja excluir este comentário permanentemente?')) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        // Delete comment and any replies referencing it
        db.lesson_comments = db.lesson_comments.filter((c: any) => c.id !== commentId && c.parent_id !== commentId);
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        const updatedComments = db.lesson_comments.filter((c: any) => c.lesson_id === lesson?.id);
        setComments(updatedComments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId || !editingText.trim()) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.lesson_comments = db.lesson_comments.map((c: any) => 
          c.id === editingCommentId ? { ...c, content: editingText.trim() } : c
        );

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        const updatedComments = db.lesson_comments.filter((c: any) => c.lesson_id === lesson?.id);
        setComments(updatedComments);
        setEditingCommentId(null);
        setEditingText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingText(currentContent);
  };

  if (isLoading || !lesson) {
    return <LessonDetailSkeleton />;
  }

  // Organize comments hierarchy: parent comments first, replies nested
  const rootComments = comments.filter(c => !c.parent_id);
  const getRepliesFor = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const getResourceIcon = (category: string) => {
    switch (category) {
      case 'spreadsheet': return <FileSpreadsheet className="text-green-400" size={20} />;
      case 'document': return <FileText className="text-blue-400" size={20} />;
      case 'presentation': return <FileVideo className="text-orange-400" size={20} />;
      default: return <FileQuestion className="text-gray-400" size={20} />;
    }
  };

  return (
    <div>
      {/* Back button and title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link href={course ? `/masterclasses/curso/${course.slug}` : '/masterclasses'} className="outline-btn text-xs" style={{ padding: '6px 12px', textDecoration: 'none' }}>
          <ArrowLeft size={12} />
          <span>Voltar para as Aulas</span>
        </Link>
        {isWatched && (
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} /> Concluída (Assistida)
          </span>
        )}
      </div>

      <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '6px', fontFamily: 'var(--font-outfit)' }}>
        {lesson.title}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
        {course?.title} • {module?.title}
      </p>

      {/* HTML5 Video Player */}
      <section className="glass-panel" style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(193, 255, 7, 0.1)', marginBottom: '30px', background: '#000' }}>
        {lesson.video_url ? (
          <video 
            ref={videoRef}
            src={lesson.video_url}
            controls
            onTimeUpdate={handleTimeUpdate}
            style={{ width: '100%', maxHeight: '480px', display: 'block', margin: '0 auto' }}
            poster={lesson.cover_image_url || lesson.thumbnail_url}
          />
        ) : (
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
            Nenhum arquivo de vídeo associado a esta aula.
          </div>
        )}
      </section>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(193, 255, 7, 0.1)', marginBottom: '24px', gap: '20px' }}>
        <button 
          onClick={() => setActiveTab('sobre')} 
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'sobre' ? '2px solid #C1FF07' : 'none',
            color: activeTab === 'sobre' ? '#C1FF07' : 'var(--text-secondary)',
            padding: '10px 5px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            fontFamily: 'var(--font-outfit)'
          }}
        >
          Sobre a Aula
        </button>
        <button 
          onClick={() => setActiveTab('recursos')} 
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'recursos' ? '2px solid #C1FF07' : 'none',
            color: activeTab === 'recursos' ? '#C1FF07' : 'var(--text-secondary)',
            padding: '10px 5px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            fontFamily: 'var(--font-outfit)'
          }}
        >
          Recursos Anexos ({resources.length})
        </button>
        <button 
          onClick={() => setActiveTab('comentarios')} 
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'comentarios' ? '2px solid #C1FF07' : 'none',
            color: activeTab === 'comentarios' ? '#C1FF07' : 'var(--text-secondary)',
            padding: '10px 5px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            fontFamily: 'var(--font-outfit)'
          }}
        >
          Discussão ({comments.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* Tab 1: Sobre */}
        {activeTab === 'sobre' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '12px' }}>Descrição da Aula</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
                {lesson.long_description || lesson.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Clock size={14} />
                <span>Duração: {lesson.duration}</span>
              </div>
            </div>

            {/* Instructor Profile Card */}
            {lesson.instructor_name && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px' }}>Instrutor</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {lesson.instructor_avatar ? (
                    <img 
                      src={lesson.instructor_avatar} 
                      alt={lesson.instructor_name} 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid var(--color-primary-lemon)' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(193,255,7,0.1)', border: '1px solid var(--color-primary-lemon)', color: 'var(--color-primary-lemon)' }} className="flex-center font-bold text-lg">
                      {lesson.instructor_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>{lesson.instructor_name}</h4>
                    <p style={{ color: 'var(--color-primary-lemon)', fontSize: '0.8rem' }}>{lesson.instructor_role}</p>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '16px', lineHeight: 1.5 }}>
                  Mentor do Grupo BBM, especializado no tema proposto. Acompanha o desenvolvimento prático dos mentorados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recursos */}
        {activeTab === 'recursos' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Material de Apoio</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Baixe os arquivos e modelos utilizados durante a exposição teórica.
                </p>
              </div>
              
              {resources.length > 0 && (
                <button 
                  onClick={handleDownloadResources} 
                  className="gold-glow-btn text-xs" 
                  disabled={zipLoading}
                  style={{ padding: '10px 16px' }}
                >
                  <Download size={14} />
                  <span>
                    {zipLoading ? 'Compactando...' : resources.length === 1 ? 'Baixar Arquivo' : 'Baixar Recursos (.ZIP)'}
                  </span>
                </button>
              )}
            </div>

            {resources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Nenhum recurso anexado a esta aula.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resources.map(res => (
                  <div 
                    key={res.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.02)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      {getResourceIcon(res.category)}
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>{res.description}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.size}</span>
                      <a 
                        href={res.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="outline-btn text-xs p-2"
                        style={{ minWidth: 'auto' }}
                        title="Fazer download"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Comentários */}
        {activeTab === 'comentarios' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px' }}>Quadro de Dúvidas & Discussão</h3>

            {/* Post comment form */}
            <form onSubmit={(e) => handleAddComment(e)} style={{ marginBottom: '30px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: 'rgba(193,255,7,0.1)', 
                  border: '1px solid var(--color-primary-lemon)',
                  color: 'var(--color-primary-lemon)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}
                className="flex-center"
              >
                {user?.initials}
              </div>
              <div style={{ flexGrow: 1, display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Escreva sua dúvida ou comentário..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
                <button type="submit" className="gold-glow-btn" style={{ padding: '12px', minWidth: 'auto' }}>
                  <Send size={16} />
                </button>
              </div>
            </form>

            {/* Editing Box Overlay modal if active */}
            {editingCommentId && (
              <div style={{ background: 'rgba(193,255,7,0.03)', border: '1px solid rgba(193, 255, 7, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#C1FF07', marginBottom: '8px' }}>Editar Comentário</h4>
                <form onSubmit={handleEditComment} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <button type="submit" className="gold-glow-btn text-xs" style={{ padding: '8px 16px' }}>Salvar</button>
                  <button type="button" onClick={() => setEditingCommentId(null)} className="outline-btn text-xs" style={{ padding: '8px 16px' }}>Cancelar</button>
                </form>
              </div>
            )}

            {/* List of comments */}
            {rootComments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Seja o primeiro a deixar um comentário!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {rootComments.map(c => {
                  const replies = getRepliesFor(c.id);
                  const isAuthor = user?.id === c.user_id;
                  const isAdmin = user?.member_type === 'admin';

                  return (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '20px' }}>
                      
                      {/* Main Comment */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {c.user_avatar ? (
                          <img src={c.user_avatar} alt={c.user_name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }} className="flex-center font-bold">
                            {c.user_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{c.user_name}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                {new Date(c.created_at).toLocaleDateString('pt-BR')} às {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {/* Actions (Edit/Delete) */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {(isAuthor || isAdmin) && (
                                <>
                                  <button onClick={() => startEditing(c.id, c.content)} className="outline-btn border-0 p-1 text-gray-500 hover:text-white" style={{ minWidth: 'auto' }}>
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteComment(c.id)} className="outline-btn border-0 p-1 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }}>
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', lineHeight: 1.5 }}>
                            {c.content}
                          </p>

                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button 
                              onClick={() => {
                                setActiveReplyBox(activeReplyBox === c.id ? null : c.id);
                                setReplyTexts(prev => ({ ...prev, [c.id]: '' }));
                              }}
                              className="outline-btn border-0 text-xs text-gray-400 p-0 hover:text-white"
                              style={{ minWidth: 'auto' }}
                            >
                              Responder
                            </button>
                          </div>

                          {/* Reply submission form */}
                          {activeReplyBox === c.id && (
                            <form onSubmit={(e) => handleAddComment(e, c.id)} style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                              <input 
                                type="text"
                                className="form-input text-xs"
                                placeholder="Digite sua resposta..."
                                value={replyTexts[c.id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [c.id]: e.target.value }))}
                                style={{ padding: '8px 12px' }}
                              />
                              <button type="submit" className="gold-glow-btn text-xs" style={{ padding: '8px 12px', minWidth: 'auto' }}>
                                <Send size={12} />
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {replies.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '30px', borderLeft: '1px solid rgba(237, 192, 102, 0.1)', paddingLeft: '16px' }}>
                          {replies.map(reply => {
                            const isReplyAuthor = user?.id === reply.user_id;

                            return (
                              <div key={reply.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ color: 'rgba(237, 192, 102, 0.3)', flexShrink: 0, marginTop: '2px' }}>
                                  <CornerDownRight size={14} />
                                </div>
                                {reply.user_avatar ? (
                                  <img src={reply.user_avatar} alt={reply.user_name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                ) : (
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem' }} className="flex-center font-bold">
                                    {reply.user_name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ flexGrow: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{reply.user_name}</span>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                        {new Date(reply.created_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    
                                    {(isReplyAuthor || isAdmin) && (
                                      <button onClick={() => handleDeleteComment(reply.id)} className="outline-btn border-0 p-1 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }}>
                                        <Trash2 size={10} />
                                      </button>
                                    )}
                                  </div>
                                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px', lineHeight: 1.4 }}>
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
