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
      <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '24px', fontFamily: 'var(--font-outfit)' }}>
        Grade Curricular
      </h2>

      {modules.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Nenhum módulo liberado para esta masterclass ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {modules.map((m, idx) => {
            const moduleLessons = lessonsByModule[m.id] || [];
            
            return (
              <div 
                key={m.id} 
                className="glass-panel" 
                style={{ 
                  padding: '24px',
                  background: m.status === 'agendado' ? 'rgba(255,255,255,0.01)' : 'var(--bg-card)',
                  borderColor: m.status === 'agendado' ? 'rgba(255,255,255,0.05)' : 'rgba(193, 255, 7, 0.1)'
                }}
              >
                {/* Module Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-lemon)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Módulo {idx + 1}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {m.title}
                      {m.status === 'agendado' && (
                        <span className="badge badge-red" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={10} /> Agendado
                        </span>
                      )}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{m.description}</p>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {moduleLessons.length} {moduleLessons.length === 1 ? 'aula' : 'aulas'}
                  </div>
                </div>

                {/* Lessons list under Module */}
                {moduleLessons.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Nenhuma aula cadastrada neste módulo.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {moduleLessons.map(lesson => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      
                      return (
                        <div 
                          key={lesson.id} 
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            transition: 'var(--transition-smooth)'
                          }}
                          className="glass-panel-hover"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, minWidth: 0 }}>
                            <div style={{ color: isCompleted ? 'var(--accent-green)' : 'var(--text-muted)', flexShrink: 0 }}>
                              {isCompleted ? <CheckCircle size={20} /> : <BookOpen size={20} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {lesson.title}
                              </h4>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                                Instrutor: {lesson.instructor_name}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <Clock size={12} />
                              <span>{lesson.duration}</span>
                            </div>

                            <Link 
                              href={`/masterclasses/aula/${lesson.slug}`}
                              className="outline-btn text-xs"
                              style={{ padding: '6px 12px', minWidth: 'auto', textDecoration: 'none' }}
                            >
                              <Play size={10} />
                              <span>Assistir</span>
                            </Link>
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
