'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Play, CheckCircle, Clock, ChevronRight, Lock, BookOpen } from 'lucide-react';
import { CourseDetailSkeleton } from '@/components/SkeletonLoaders';
import { Course, Module, Lesson } from '@/lib/db';

export default function CourseModulesPage() {
  const { user } = useAuth();
  const { courseSlug } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredLessonId, setHoveredLessonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await fetch('/api/db');
        if (!response.ok) throw new Error('Failed to load database');
        const db = await response.json();

        // 1. Find course
        const foundCourse = db.courses.find((c: Course) => c.slug === courseSlug);
        if (!foundCourse) {
          router.push('/masterclasses');
          return;
        }

        // Apply time filter on course if not admin
        if (user?.member_type !== 'admin' && foundCourse.status !== 'published') {
          router.push('/masterclasses');
          return;
        }

        setCourse(foundCourse);

        // 2. Find and filter modules
        let rawModules = db.modules.filter((m: Module) => m.course_id === foundCourse.id);
        const now = new Date();

        if (user?.member_type !== 'admin') {
          rawModules = rawModules.filter((m: Module) => {
            if (m.status === 'agendado') {
              if (!m.scheduled_at) return false;
              return new Date(m.scheduled_at) <= now;
            }
            return m.status === 'published';
          });
        }
        rawModules.sort((a: Module, b: Module) => a.sequence_order - b.sequence_order);
        setModules(rawModules);

        // 3. Find and filter lessons per module
        const lessonsMap: Record<string, Lesson[]> = {};
        rawModules.forEach((m: Module) => {
          let moduleLessons = db.lessons.filter((l: Lesson) => l.module_id === m.id);
          
          if (user?.member_type !== 'admin') {
            moduleLessons = moduleLessons.filter((l: Lesson) => {
              if (l.status === 'agendado') {
                if (!l.scheduled_at) return false;
                return new Date(l.scheduled_at) <= now;
              }
              return l.status === 'published';
            });
          }
          moduleLessons.sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order);
          lessonsMap[m.id] = moduleLessons;
        });
        setLessonsByModule(lessonsMap);

        // 4. Load user progress
        const userProgress = db.user_lesson_progress.filter(
          (p: any) => p.user_id === user?.id && p.completed
        );
        const completedIds = new Set<string>(userProgress.map((p: any) => p.lesson_id));
        setCompletedLessonIds(completedIds);

      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && courseSlug) {
      fetchCourseData();
    }
  }, [user, courseSlug, router]);

  if (isLoading || !course) {
    return <CourseDetailSkeleton />;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        <Link href="/masterclasses" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="hover:underline">
          Masterclasses
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: '#fff' }}>{course.title}</span>
      </div>

      {/* Course Banner */}
      <section 
        className="glass-panel" 
        style={{ 
          padding: '30px', 
          marginBottom: '40px',
          background: course.cover_image_url ? `linear-gradient(rgba(1,1,5,0.85), rgba(1,1,5,0.95)), url(${course.cover_image_url})` : 'var(--bg-card)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: 'rgba(193,255,7,0.2)'
        }}
      >
        <span className="badge badge-gold" style={{ marginBottom: '10px' }}>Curso Masterclass</span>
        <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '12px', fontFamily: 'var(--font-outfit)' }}>{course.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>{course.description}</p>
      </section>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Nenhum módulo liberado para esta masterclass ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {modules.map((m, idx) => {
            const moduleLessons = lessonsByModule[m.id] || [];
            
            return (
              <div key={m.id} className="flex flex-col gap-6">
                
                {/* Module Header (e.g. Aulas Semanais) */}
                <div className="flex justify-between items-end border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#C1FF07] uppercase tracking-wider font-outfit">
                      Módulo {idx + 1}
                    </span>
                    <h3 className="text-xl font-extrabold text-white font-outfit tracking-tight mt-1 flex items-center gap-2">
                      {m.title}
                      {m.status === 'agendado' && (
                        <span className="badge badge-red flex items-center gap-1 text-[9px] py-0.5 px-1.5 uppercase font-bold tracking-wider">
                          <Lock size={8} /> Agendado
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">{m.description}</p>
                  </div>
                  <span className="text-[11px] font-bold text-white/30 uppercase font-outfit tracking-wider">
                    {moduleLessons.length} {moduleLessons.length === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>

                {/* Grid of Lesson Cards */}
                {moduleLessons.length === 0 ? (
                  <p className="text-xs text-text-muted italic">
                    Nenhuma aula cadastrada neste módulo.
                  </p>
                ) : (
                  <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none scroll-smooth">
                    {moduleLessons.map(lesson => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      const isHovered = hoveredLessonId === lesson.id;
                      
                      // Fallback premium cover images
                      const defaultCover = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400';
                      const coverSrc = lesson.cover_image_url || lesson.thumbnail_url || defaultCover;
                      
                      // Mux Animated GIF playback (use a fallback test ID if no custom playback ID in video_url)
                      const testPlaybackId = 'q4v4v3J6ZgZ7J9gO0200gZ02q7e9V4z00a300';
                      const muxGifUrl = `https://image.mux.com/${testPlaybackId}/animated.gif?width=320`;

                      return (
                        <div 
                          key={lesson.id}
                          className="glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden group w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] flex-shrink-0 snap-start"
                          style={{ borderRadius: '4px' }}
                          onMouseEnter={() => setHoveredLessonId(lesson.id)}
                          onMouseLeave={() => setHoveredLessonId(null)}
                        >
                          {/* Image Thumbnail Container */}
                          <div className="relative aspect-video w-full bg-black/40 overflow-hidden border-b border-white/[0.04]">
                            <img 
                              src={isHovered ? muxGifUrl : coverSrc} 
                              alt={lesson.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                            />
                            
                            {/* Overlay Badges */}
                            <div className="absolute top-3 left-3 z-10 flex gap-2">
                              {isCompleted ? (
                                <span className="bg-emerald-500 text-bg-deep px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                                  <CheckCircle size={8} className="fill-bg-deep" />
                                  Concluída
                                </span>
                              ) : (
                                <span className="bg-[#12131a]/85 border border-white/10 text-white/70 px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                                  <BookOpen size={8} />
                                  Disponível
                                </span>
                              )}
                            </div>

                            <div className="absolute bottom-3 right-3 z-10">
                              <span className="bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-sm text-[9px] text-white/80 font-mono font-bold">
                                {lesson.duration || '00:00'}
                              </span>
                            </div>

                            {/* Hover Play Button Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-[#C1FF07] text-[#010103] flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                                <Play size={16} className="fill-[#010103] ml-0.5" />
                              </div>
                            </div>
                          </div>

                          {/* Info & Content */}
                          <div className="p-4 flex flex-col justify-between flex-grow gap-4">
                            <div className="flex flex-col gap-1.5">
                              <h4 className="text-sm font-extrabold text-white tracking-tight leading-snug group-hover:text-[#C1FF07] transition duration-150 text-ellipsis overflow-hidden line-clamp-1">
                                {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                                  {lesson.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                              <span className="text-[10px] text-text-secondary font-medium truncate max-w-[60%]">
                                Instrutor: {lesson.instructor_name || 'Mentor CLS'}
                              </span>
                              
                              <Link 
                                href={`/masterclasses/aula/${lesson.slug}`}
                                className="outline-btn text-[10px] tracking-wider uppercase font-bold"
                                style={{ padding: '6px 12px', minWidth: 'auto', textDecoration: 'none' }}
                              >
                                <span>Ver Aula</span>
                              </Link>
                            </div>
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
  );
}
