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
  Info,
  ThumbsUp,
  Bookmark,
  Star,
  Check
} from 'lucide-react';
import { customAlert, customConfirm } from '@/components/CustomConfirm';
import { LessonDetailSkeleton } from '@/components/SkeletonLoaders';
import { Lesson, Resource, LessonComment, Course, Module } from '@/lib/db';
import MuxPlayer from '@mux/mux-player-react';

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
  const videoRef = useRef<any>(null);
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

  // Lesson interactions states (Case style)
  const [rating, setRating] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isUseful, setIsUseful] = useState<boolean>(false);
  const [usefulCount, setUsefulCount] = useState<number>(12); // mock start count
  const [moduleLessons, setModuleLessons] = useState<Lesson[]>([]);

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

        // 6. Load all lessons of this module
        if (foundModule) {
          let list = db.lessons.filter((l: Lesson) => l.module_id === foundModule.id);
          // Apply time filter if not admin
          if (user?.member_type !== 'admin') {
            list = list.filter((l: Lesson) => {
              if (l.status === 'published') return true;
              if (l.status === 'agendado') {
                return l.scheduled_at && new Date(l.scheduled_at) <= now;
              }
              return false;
            });
          }
          list.sort((a: Lesson, b: Lesson) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0));
          setModuleLessons(list);
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
      customAlert('Erro ao compactar arquivos. Experimente baixar um a um.');
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
import { customConfirm } from '@/components/ui/CustomConfirm';
{{ ... }}
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

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    const isConfirmed = await customConfirm('Deseja excluir este comentário permanentemente?', 'Excluir Comentário');
    if (!isConfirmed) return;
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

  const handleToggleWatched = async () => {
    if (!user || !lesson) return;
    const nextWatched = !isWatched;
    setIsWatched(nextWatched);

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        const existingIndex = db.user_lesson_progress.findIndex(
          (p: any) => p.user_id === user.id && p.lesson_id === lesson.id
        );

        const video = videoRef.current;
        const currentSeconds = video ? Math.floor(video.currentTime) : 0;
        const totalSeconds = video && !isNaN(video.duration) ? Math.floor(video.duration) : 100;
        
        const newProgress = {
          id: existingIndex > -1 ? db.user_lesson_progress[existingIndex].id : `progress-${Date.now()}`,
          user_id: user.id,
          lesson_id: lesson.id,
          watched_seconds: nextWatched ? totalSeconds : currentSeconds,
          total_seconds: totalSeconds,
          percent_complete: nextWatched ? 100 : 0,
          completed: nextWatched,
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUseful = () => {
    if (isUseful) {
      setUsefulCount(prev => prev - 1);
    } else {
      setUsefulCount(prev => prev + 1);
    }
    setIsUseful(!isUseful);
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
      case 'spreadsheet': return <FileSpreadsheet className="text-green-400" size={18} />;
      case 'document': return <FileText className="text-blue-400" size={18} />;
      case 'presentation': return <FileVideo className="text-orange-400" size={18} />;
      default: return <FileQuestion className="text-gray-400" size={18} />;
    }
  };

  // Find index of current lesson within module
  const currentLessonIndex = moduleLessons.findIndex(l => l.id === lesson.id);
  const lessonNumber = currentLessonIndex > -1 ? currentLessonIndex + 1 : 1;

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── BREADCRUMBS ── */}
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase font-outfit text-white/40">
        <Link href={course ? `/masterclasses/curso/${course.slug}` : '/masterclasses'} className="hover:text-white transition duration-150 no-underline flex items-center gap-1">
          <ArrowLeft size={12} />
          <span>Voltar</span>
        </Link>
        <span>/</span>
        <span className="text-white/70">{course?.title || 'Aulas'}</span>
      </div>

      {/* ── TWO-COLUMN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT COLUMN (Video & Info) ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Mux Video Player */}
          <section className="glass-panel overflow-hidden bg-black aspect-video flex items-center justify-center relative">
            {lesson.video_url ? (
              <MuxPlayer 
                ref={videoRef}
                src={lesson.video_url}
                onTimeUpdate={handleTimeUpdate}
                style={{ width: '100%', height: '100%', display: 'block' }}
                poster={lesson.cover_image_url || lesson.thumbnail_url}
                accentColor="#C1FF07"
                metadata={{
                  video_id: lesson.id,
                  video_title: lesson.title,
                }}
              />
            ) : (
              <div className="flex flex-col justify-center items-center text-white/40 text-sm gap-2">
                <FileVideo size={32} />
                <span>Nenhum arquivo de vídeo associado a esta aula.</span>
              </div>
            )}
          </section>

          {/* Lesson Metadata Banner */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-[#C1FF07]/10 text-[#C1FF07] border border-[#C1FF07]/10 uppercase tracking-widest font-outfit">
                Aula {lessonNumber} • {lesson.duration || '1h 00m'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-outfit tracking-tight">
              {lesson.title}
            </h1>
          </div>

          {/* Description & Instructor Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-white/5">
            
            {/* Instructor / Description Card */}
            <div className="md:col-span-8 flex flex-col gap-5">
              
              {lesson.instructor_name && (
                <div className="flex items-center gap-4">
                  {lesson.instructor_avatar ? (
                    <img 
                      src={lesson.instructor_avatar} 
                      alt={lesson.instructor_name} 
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold text-sm">
                      {lesson.instructor_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{lesson.instructor_name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{lesson.instructor_role || 'Mentor Principal'}</p>
                  </div>
                </div>
              )}

              <p className="text-white/60 text-sm font-inter leading-relaxed">
                {lesson.long_description || lesson.description}
              </p>
            </div>

            {/* Resources / Attachments */}
            <div className="md:col-span-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 font-outfit">
                Materiais Complementares
              </h3>

              {resources.length === 0 ? (
                <p className="text-xs text-text-muted italic">
                  Sem materiais complementares para esta aula.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {resources.map(res => (
                    <a 
                      key={res.id}
                      href={res.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="glass-panel p-3 flex items-center justify-between no-underline text-white transition-all duration-150 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getResourceIcon(res.category)}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap">{res.title}</h4>
                          <span className="text-[10px] text-text-muted">{res.size}</span>
                        </div>
                      </div>
                      <Download size={12} className="text-text-muted hover:text-white" />
                    </a>
                  ))}
                  
                  {resources.length > 1 && (
                    <button 
                      onClick={handleDownloadResources} 
                      disabled={zipLoading}
                      className="w-full py-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-white text-xs font-semibold rounded cursor-pointer transition duration-150 flex items-center justify-center gap-2"
                    >
                      <Download size={12} />
                      <span>{zipLoading ? 'Compactando...' : 'Baixar todos (.ZIP)'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Discussion / Comments Section */}
          <div className="pt-6 border-t border-white/5 flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 font-outfit">
              Dúvidas & Discussão ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={(e) => handleAddComment(e)} className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.initials}
              </div>
              <div className="flex-grow flex gap-2">
                <input 
                  type="text" 
                  className="form-input text-sm flex-grow" 
                  placeholder="Tem alguma dúvida? Escreva aqui..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: '9px 15px' }}>
                  <Send size={14} />
                </button>
              </div>
            </form>

            {/* Comment List */}
            {rootComments.length === 0 ? (
              <p className="text-xs text-text-muted italic text-center py-4">
                Nenhum comentário enviado ainda. Seja o primeiro a perguntar!
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {rootComments.map(c => {
                  const replies = getRepliesFor(c.id);
                  const isAuthor = user?.id === c.user_id;
                  const isAdmin = user?.member_type === 'admin';

                  return (
                    <div key={c.id} className="flex flex-col gap-3 pb-4 border-b border-white/[0.02]">
                      <div className="flex gap-3.5 items-start">
                        {c.user_avatar ? (
                          <img src={c.user_avatar} alt={c.user_name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold text-xs">
                            {c.user_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2 items-center text-xs">
                              <span className="font-bold text-white">{c.user_name}</span>
                              <span className="text-[10px] text-text-muted">
                                {new Date(c.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            {(isAuthor || isAdmin) && (
                              <div className="flex gap-1">
                                <button onClick={() => startEditing(c.id, c.content)} className="p-1 text-white/40 hover:text-white bg-transparent border-0 cursor-pointer">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteComment(c.id)} className="p-1 text-red-500/50 hover:text-red-400 bg-transparent border-0 cursor-pointer">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-white/70 text-xs font-inter mt-1 leading-relaxed">{c.content}</p>
                          
                          <div className="flex gap-3.5 mt-2">
                            <button 
                              onClick={() => {
                                setActiveReplyBox(activeReplyBox === c.id ? null : c.id);
                                setReplyTexts(prev => ({ ...prev, [c.id]: '' }));
                              }}
                              className="text-[10px] text-white/40 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                            >
                              Responder
                            </button>
                          </div>

                          {activeReplyBox === c.id && (
                            <form onSubmit={(e) => handleAddComment(e, c.id)} className="flex gap-2 mt-3">
                              <input 
                                type="text"
                                className="form-input text-xs"
                                placeholder="Digite sua resposta..."
                                value={replyTexts[c.id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [c.id]: e.target.value }))}
                              />
                              <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}>
                                <Send size={12} />
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {replies.length > 0 && (
                        <div className="flex flex-col gap-3 pl-8 ml-4 border-l border-white/[0.04] mt-2">
                          {replies.map(reply => {
                            const isReplyAuthor = user?.id === reply.user_id;

                            return (
                              <div key={reply.id} className="flex gap-2.5 items-start">
                                <div className="text-white/20 mt-1"><CornerDownRight size={12} /></div>
                                {reply.user_avatar ? (
                                  <img src={reply.user_avatar} alt={reply.user_name} className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold text-[10px]">
                                    {reply.user_name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center text-xs">
                                      <span className="font-bold text-white">{reply.user_name}</span>
                                      <span className="text-[10px] text-text-muted">
                                        {new Date(reply.created_at).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    {(isReplyAuthor || isAdmin) && (
                                      <button onClick={() => handleDeleteComment(reply.id)} className="p-1 text-red-500/50 hover:text-red-400 bg-transparent border-0 cursor-pointer">
                                        <Trash2 size={10} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-white/60 text-xs font-inter mt-1 leading-relaxed">{reply.content}</p>
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

        </div>

        {/* ── RIGHT COLUMN (Sidebar) ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Interações da Aula */}
          <section className="glass-panel p-5 flex flex-col gap-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 font-outfit">
              Interações da Aula
            </h3>

            {/* Checkbox Concluída */}
            <button 
              onClick={handleToggleWatched}
              className={`w-full py-3 px-4 bg-transparent border text-xs font-bold font-outfit uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center justify-center gap-3 ${
                isWatched 
                  ? 'border-[#C1FF07]/30 text-[#C1FF07] bg-[#C1FF07]/5' 
                  : 'border-white/[0.08] text-white/60 hover:text-white hover:border-white/20'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isWatched ? 'border-[#C1FF07]' : 'border-white/30'}`}>
                {isWatched && <Check size={10} />}
              </span>
              <span>{isWatched ? 'Aula Concluída' : 'Marcar como Concluída'}</span>
            </button>

            {/* Rating Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.05]">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Avaliar</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 bg-transparent border-0 cursor-pointer text-white/20 hover:text-[#C1FF07] transition duration-150"
                    style={{ minWidth: 'auto' }}
                  >
                    <Star 
                      size={18} 
                      className={star <= rating ? 'fill-[#C1FF07] text-[#C1FF07]' : ''} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Mark as Useful */}
            <button 
              onClick={handleToggleUseful}
              className={`w-full py-2.5 px-4 bg-transparent border text-xs font-bold font-outfit tracking-wide cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                isUseful 
                  ? 'border-[#C1FF07]/30 text-[#C1FF07] bg-[#C1FF07]/5'
                  : 'border-white/[0.08] text-white/60 hover:text-white hover:border-white/20'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <ThumbsUp size={14} />
              <span>Marcar como Útil ({usefulCount})</span>
            </button>

            {/* Save Lesson */}
            <button 
              onClick={() => setIsSaved(!isSaved)}
              className={`w-full py-2.5 px-4 bg-transparent border text-xs font-bold font-outfit tracking-wide cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                isSaved 
                  ? 'border-[#C1FF07]/30 text-[#C1FF07] bg-[#C1FF07]/5'
                  : 'border-white/[0.08] text-white/60 hover:text-white hover:border-white/20'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <Bookmark size={14} />
              <span>{isSaved ? 'Aula Salva' : 'Salvar Aula'}</span>
            </button>
          </section>

          {/* Aulas deste Módulo */}
          <section className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 font-outfit">
              Aulas deste Módulo
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {moduleLessons.map((item, idx) => {
                const isCurrent = item.id === lesson.id;
                
                return (
                  <Link 
                    key={item.id}
                    href={`/masterclasses/aula/${item.slug}`}
                    className={`p-3.5 border transition-all duration-200 flex items-start gap-3 no-underline ${
                      isCurrent 
                        ? 'border-[#C1FF07]/30 bg-[#C1FF07]/5 text-white' 
                        : 'border-white/[0.04] bg-white/[0.01] text-white/50 hover:text-white hover:border-white/10'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      isCurrent ? 'bg-[#C1FF07]/10 text-[#C1FF07]' : 'bg-white/5 text-white/40'
                    }`}>
                      <Play size={10} className={isCurrent ? 'fill-[#C1FF07]' : ''} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted">Aula {idx + 1}</span>
                      <span className="text-xs font-bold leading-tight">{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
