'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MasterclassesSkeleton } from '@/components/SkeletonLoaders';
import { Play, Info, ArrowRight, Clock, Video } from 'lucide-react';
import { Course, Lesson, Module } from '@/lib/db';

export default function MasterclassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Featured Course for Hero Banner
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchMasterclassData = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const db = await response.json();
          let coursesList = db.courses || [];
          let modulesList = db.modules || [];
          let lessonsList = db.lessons || [];
          
          // Apply time-visibility filter for non-admin users
          if (user?.member_type !== 'admin') {
            coursesList = coursesList.filter((c: Course) => c.status === 'published');
            modulesList = modulesList.filter((m: Module) => m.status === 'published');
            lessonsList = lessonsList.filter((l: Lesson) => l.status === 'published');
          }
          
          // Sort lists
          coursesList.sort((a: Course, b: Course) => a.sequence_order - b.sequence_order);
          modulesList.sort((a: Module, b: Module) => a.sequence_order - b.sequence_order);
          lessonsList.sort((a: Lesson, b: Lesson) => a.sequence_order - b.sequence_order);

          setCourses(coursesList);
          setModules(modulesList);
          setLessons(lessonsList);

          // Set first course as featured
          if (coursesList.length > 0) {
            setFeaturedCourse(coursesList[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching masterclasses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchMasterclassData();
    }
  }, [user]);

  if (isLoading) {
    return <MasterclassesSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 pb-12 w-full max-w-full overflow-hidden">
      
      {/* Featured Netflix-style Hero Banner */}
      {featuredCourse && (
        <section className="relative w-full h-[260px] md:h-[420px] rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${featuredCourse.cover_image_url}')` }}>
          {/* Gradients to fade bottom and sides */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#010103] via-[#010103]/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-transparent to-transparent z-10" />
          
          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-6 md:right-12 p-6 md:p-12 z-20 max-w-lg flex flex-col gap-3">
            <span className="badge badge-lemon self-start uppercase tracking-wider text-[10px] font-bold">
              Destaque BBM
            </span>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight font-outfit m-0 leading-tight text-white">
              {featuredCourse.title}
            </h1>
            <p className="text-white/70 text-xs md:text-sm leading-relaxed max-md:hidden">
              {featuredCourse.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-1">
              <Link 
                href={`/masterclasses/curso/${featuredCourse.slug}`}
                className="btn-primary no-underline text-xs py-2 px-3.5 md:text-sm md:py-2.5 md:px-5"
              >
                <Play size={14} fill="currentColor" />
                <span>Assistir</span>
              </Link>
              <Link 
                href={`/masterclasses/curso/${featuredCourse.slug}`}
                className="btn-secondary no-underline text-xs py-2 px-3.5 md:text-sm md:py-2.5 md:px-5"
              >
                <Info size={14} />
                <span>Mais Info</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Row 1: Programs (Courses Carousel) */}
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        <h2 className="text-lg font-bold font-outfit px-1">Programas de Mentoria (Cursos)</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 w-full">
          {courses.map(course => (
              <Link 
                key={course.id} 
                href={`/masterclasses/curso/${course.slug}`}
                className="w-[200px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/10 flex flex-col justify-end"
              >
                <div className="absolute inset-0 z-0">
                  <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90" />
                
                <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                  <span className="text-[8px] md:text-[10px] font-extrabold uppercase tracking-wider text-[#C1FF07] font-outfit drop-shadow-md">
                    CURSO COMPLETO
                  </span>
                  <h3 className="text-white text-xs md:text-lg font-bold leading-tight font-outfit m-0 drop-shadow-lg">
                    {course.title}
                  </h3>
                </div>
              </Link>
          ))}
        </div>
      </div>

      {/* Row 2: All Active Lessons (Netflix Episodes style Carousel) */}
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        <h2 className="text-lg font-bold font-outfit px-1">Aulas Recentes (Assista Agora)</h2>
        {lessons.length === 0 ? (
          <div className="glass-panel p-6 text-center text-text-secondary text-sm mx-1">
            Nenhuma aula cadastrada.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 w-full">
            {lessons.map(lesson => {
              // Find matching course/module for linking
              const parentModule = modules.find(m => m.id === lesson.module_id);
              const parentCourse = parentModule ? courses.find(c => c.id === parentModule.course_id) : null;
              const linkUrl = parentCourse 
                ? `/masterclasses/curso/${parentCourse.slug}?lesson=${lesson.slug}` 
                : '/masterclasses';

              return (
                <Link 
                  key={lesson.id} 
                  href={linkUrl}
                  className="w-[200px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/10 flex flex-col justify-end"
                >
                  <div className="absolute inset-0 z-0">
                    <img src={lesson.cover_image_url || lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                  
                  {/* Play icon overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                    <div className="w-12 h-12 rounded-full bg-primary-lemon text-bg-deep flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </div>
                  </div>

                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90" />
                  
                  <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-[#C1FF07] font-extrabold uppercase tracking-wider font-outfit drop-shadow-md">
                      <Clock size={10} />
                      <span>{lesson.duration || '00:00'}</span>
                    </div>
                    <h3 className="text-white text-xs md:text-lg font-bold leading-tight font-outfit m-0 drop-shadow-lg">
                      {lesson.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 3: Modules and Chapters Carousel */}
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        <h2 className="text-lg font-bold font-outfit px-1">Módulos & Áreas de Foco</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 w-full">
          {modules.map(m => {
            const course = courses.find(c => c.id === m.course_id);
            const courseSlug = course ? course.slug : '';
            return (
              <Link 
                key={m.id} 
                href={courseSlug ? `/masterclasses/curso/${courseSlug}` : '/masterclasses'}
                className="w-[200px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/10 flex flex-col justify-end"
              >
                <div className="absolute inset-0 z-0">
                  <img src={m.cover_image_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90" />
                
                <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                  <span className="text-[8px] md:text-[10px] font-extrabold uppercase tracking-wider text-[#C1FF07] font-outfit drop-shadow-md">
                    MÓDULO
                  </span>
                  <h3 className="text-white text-xs md:text-lg font-bold leading-tight mt-1 font-outfit drop-shadow-lg m-0">
                    {m.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
