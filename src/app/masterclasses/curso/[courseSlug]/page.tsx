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
    <div className="w-full max-w-full overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase font-outfit text-text-muted mb-5">
        <Link href="/masterclasses" className="hover:text-text-base transition duration-150 no-underline text-text-secondary">
          Masterclasses
        </Link>
        <ChevronRight size={12} className="text-text-muted" />
        <span className="text-text-base max-w-[180px] sm:max-w-none truncate">{course.title}</span>
      </div>

      {/* Course Banner */}
      <section 
        className="glass-panel p-5 md:p-10 mb-8" 
        style={{ 
          background: course.cover_image_url ? `linear-gradient(rgba(1,1,5,0.85), rgba(1,1,5,0.95)), url('${course.cover_image_url}')` : 'var(--bg-card)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: 'rgba(193,255,7,0.2)'
        }}
      >
        <span className="badge badge-gold mb-2.5">Curso Masterclass</span>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 font-outfit">{course.title}</h1>
        <p className="text-white/70 text-sm md:text-base max-w-2xl leading-relaxed">{course.description}</p>
      </section>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="glass-panel p-6 md:p-10 text-center text-text-secondary">
          Nenhum módulo liberado para esta masterclass ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {modules.map((m, idx) => {
            const moduleLessons = lessonsByModule[m.id] || [];
            
            return (
              <div key={m.id} className="flex flex-col gap-6">
                
                {/* Module Header (e.g. Aulas Semanais) */}
                <div className="flex flex-col border-b border-white/5 pb-3 gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-extrabold text-[#C1FF07] uppercase tracking-wider font-outfit">
                      Módulo {idx + 1}
                    </span>
                    <span className="text-text-muted text-[10px] font-bold">•</span>
                    <span className="text-text-secondary text-[10px] font-bold uppercase font-outfit tracking-wider">
                      {moduleLessons.length} {moduleLessons.length === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold font-outfit tracking-tight flex items-center gap-2 text-text-base m-0">
                    {m.title}
                    {m.status === 'agendado' && (
                      <span className="badge badge-red flex items-center gap-1 text-[9px] py-0.5 px-1.5 uppercase font-bold tracking-wider">
                        <Lock size={8} /> Agendado
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed m-0">{m.description}</p>
                </div>

                {/* Grid of Lesson Cards */}
                {moduleLessons.length === 0 ? (
                  <p className="text-xs text-text-muted italic">
                    Nenhuma aula cadastrada neste módulo.
                  </p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 scroll-smooth">
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
                        <Link 
                          key={lesson.id}
                          href={`/masterclasses/aula/${lesson.slug}`}
                          className="w-[200px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/10 flex flex-col justify-end"
                          onMouseEnter={() => setHoveredLessonId(lesson.id)}
                          onMouseLeave={() => setHoveredLessonId(null)}
                        >
                          <div className="absolute inset-0 z-0">
                            <img 
                              src={isHovered ? muxGifUrl : coverSrc} 
                              alt={lesson.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90" />
                          
                          <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-[#C1FF07] font-extrabold uppercase tracking-wider font-outfit drop-shadow-md">
                              {isCompleted ? (
                                <span className="bg-emerald-500 text-[#010103] px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-md font-bold">
                                  <CheckCircle size={10} /> Concluída
                                </span>
                              ) : (
                                <>
                                  <Clock size={10} />
                                  <span>{lesson.duration || '00:00'}</span>
                                </>
                              )}
                            </div>
                            <h3 className="text-white text-xs md:text-sm font-bold leading-tight font-outfit m-0 drop-shadow-lg line-clamp-2">
                              {lesson.title}
                            </h3>
                          </div>
                        </Link>
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
