'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MasterclassesSkeleton } from '@/components/SkeletonLoaders';
import { Play, Info, ArrowRight, Clock, Video } from 'lucide-react';
import { Course, Lesson, Module } from '@/lib/db';
import { ModuleCard } from '@/components/ModuleCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipStats } from '@/components/ui/tooltip';

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
      
      {/* Featured Netflix-style Hero Banner (Sci-Fi Cut) */}
      {featuredCourse && (
        <section 
          className="relative w-full h-[260px] md:h-[420px] rounded-none border border-white/15 overflow-hidden bg-cover bg-center" 
          style={{ backgroundImage: `url('${featuredCourse.cover_image_url}')` }}
        >
          {/* Sci-Fi Tech Corner Markers */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C1FF07] z-30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C1FF07] z-30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C1FF07] z-30 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C1FF07] z-30 pointer-events-none" />

          {/* Gradients to fade bottom and sides */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#010103] via-[#010103]/75 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-transparent to-transparent z-10" />
          
          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-6 md:right-12 p-6 md:p-10 z-20 max-w-lg flex flex-col gap-3">
            <span className="font-mono uppercase tracking-widest text-[9px] font-bold text-[#C1FF07] px-2.5 py-1 bg-black/80 border border-[#C1FF07]/40 rounded-none self-start">
              SYS // DESTAQUE BBM
            </span>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight font-outfit m-0 leading-tight text-white uppercase">
              {featuredCourse.title}
            </h1>
            <p className="text-white/70 text-xs md:text-sm leading-relaxed max-md:hidden font-sans">
              {featuredCourse.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Link 
                href={`/masterclasses/curso/${featuredCourse.slug}`}
                className="btn-primary no-underline text-xs py-2.5 px-5 rounded-none font-mono uppercase tracking-widest font-bold"
              >
                <Play size={13} fill="currentColor" />
                <span>Assistir</span>
              </Link>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      href={`/masterclasses/curso/${featuredCourse.slug}`}
                      className="btn-secondary no-underline text-xs py-2.5 px-5 rounded-none font-mono uppercase tracking-widest font-bold"
                    >
                      <Info size={13} />
                      <span>Mais Info</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow className="p-3 rounded-none font-mono">
                    <TooltipStats
                      items={[
                        { label: 'PROGRAMA', value: featuredCourse.title },
                        { label: 'MÓDULOS', value: `${modules.filter(m => m.course_id === featuredCourse.id).length} DISPONÍVEIS` },
                        { label: 'ACESSO', value: <span className="text-[#C1FF07]">LIBERADO</span> },
                      ]}
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </section>
      )}

      {/* Row 1: Programs (Courses Carousel) */}
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-mono uppercase tracking-widest text-text-secondary">
            // 01_PROGRAMAS DE MENTORIA
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 w-full">
          {courses.map(course => (
              <Link 
                key={course.id} 
                href={`/masterclasses/curso/${course.slug}`}
                className="w-[200px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-none overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/15 hover:border-[#C1FF07]/60 flex flex-col justify-end transition-all"
              >
                <div className="absolute inset-0 z-0">
                  <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90" />
                
                <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                  <span className="font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-[#C1FF07]">
                    SYS // CURSO COMPLETO
                  </span>
                  <h3 className="text-white text-xs md:text-base font-bold leading-tight font-outfit uppercase m-0 drop-shadow-lg">
                    {course.title}
                  </h3>
                </div>
              </Link>
          ))}
        </div>
      </div>

      {/* Row 2: All Active Lessons (Netflix Episodes style Carousel) */}
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-mono uppercase tracking-widest text-text-secondary">
            // 02_AULAS RECENTES
          </h2>
        </div>
        {lessons.length === 0 ? (
          <div className="glass-panel p-6 text-center text-text-secondary text-sm mx-1 rounded-none">
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
                  className="w-[200px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-none overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/15 hover:border-[#C1FF07]/60 flex flex-col justify-end transition-all"
                >
                  <div className="absolute inset-0 z-0">
                    <img src={lesson.cover_image_url || lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                  
                  {/* Play icon overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                    <div className="w-11 h-11 rounded-none bg-[#C1FF07] text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90" />
                  
                  <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                    <div className="flex items-center gap-1.5 font-mono text-[8px] md:text-[9px] text-[#C1FF07] font-bold uppercase tracking-wider">
                      <Clock size={10} />
                      <span>{lesson.duration || '00:00'}</span>
                    </div>
                    <h3 className="text-white text-xs md:text-base font-bold leading-tight font-outfit uppercase m-0 drop-shadow-lg">
                      {lesson.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 3: Modules and Chapters Carousel (Sci-Fi Style) */}
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-mono uppercase tracking-widest text-text-secondary">
            // 03_MÓDULOS & ÁREAS DE FOCO
          </h2>
          <span className="text-[11px] font-mono text-text-muted font-bold">
            [{modules.length} {modules.length === 1 ? 'MÓDULO' : 'MÓDULOS'}]
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory px-1 w-full">
          {modules.map((m, idx) => {
            const course = courses.find(c => c.id === m.course_id);
            const courseSlug = course ? course.slug : '';
            const moduleLessons = lessons.filter(l => l.module_id === m.id);
            const fallbackCover = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600';
            
            return (
              <ModuleCard
                key={m.id}
                title={m.title}
                description={m.description}
                imageUrl={m.cover_image_url || fallbackCover}
                href={courseSlug ? `/masterclasses/curso/${courseSlug}` : '/masterclasses'}
                moduleNumber={idx + 1}
                lessonCount={moduleLessons.length}
                actionLabel="Acessar Módulo"
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}
