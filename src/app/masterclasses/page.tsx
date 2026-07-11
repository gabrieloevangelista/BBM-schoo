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
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Featured Netflix-style Hero Banner */}
      {featuredCourse && (
        <section className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${featuredCourse.cover_image_url})` }}>
          {/* Gradients to fade bottom and sides */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#010103] via-[#010103]/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-transparent to-transparent z-10" />
          
          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 p-6 md:p-12 z-20 max-w-lg flex flex-col gap-3">
            <span className="badge badge-lemon self-start uppercase tracking-wider text-[10px] font-bold">
              Destaque BBM
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-outfit m-0 leading-tight text-white">
              {featuredCourse.title}
            </h1>
            <p className="text-white/70 text-xs md:text-sm leading-relaxed max-md:hidden">
              {featuredCourse.description}
            </p>

            <div className="flex gap-3.5 mt-2">
              <Link 
                href={`/masterclasses/curso/${featuredCourse.slug}`}
                className="btn-primary no-underline"
              >
                <Play size={16} fill="currentColor" />
                <span>Assistir</span>
              </Link>
              <Link 
                href={`/masterclasses/curso/${featuredCourse.slug}`}
                className="btn-secondary no-underline"
              >
                <Info size={16} />
                <span>Mais Informações</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Row 1: Programs (Courses Carousel) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold font-outfit px-1">Programas de Mentoria (Cursos)</h2>
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1">
          {courses.map(course => (
            <Link 
              key={course.id} 
              href={`/masterclasses/curso/${course.slug}`}
              className="w-[280px] md:w-[320px] aspect-video rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/5"
            >
              <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 z-10" />
              
              <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-1">
                <span className="text-[9px] text-primary-lemon font-bold uppercase tracking-wider">Curso Completo</span>
                <h3 className="text-sm font-bold m-0 font-outfit leading-tight group-hover:text-primary-lemon transition-colors text-white">
                  {course.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 2: All Active Lessons (Netflix Episodes style Carousel) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold font-outfit px-1">Aulas Recentes (Assista Agora)</h2>
        {lessons.length === 0 ? (
          <div className="glass-panel p-6 text-center text-text-secondary text-sm mx-1">
            Nenhuma aula cadastrada.
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1">
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
                  className="w-[240px] md:w-[280px] aspect-video rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/5"
                >
                  <img src={lesson.cover_image_url || lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  {/* Play icon overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="w-10 h-10 rounded-full bg-primary-lemon text-bg-deep flex items-center justify-center shadow-lg">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 z-10" />
                  
                  <div className="absolute bottom-3 left-3 right-3 z-15 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] text-primary-lemon font-bold uppercase tracking-wider">
                      <Clock size={10} />
                      <span>{lesson.duration}</span>
                    </div>
                    <h3 className="text-xs font-bold m-0 leading-tight text-white">
                      {lesson.title}
                    </h3>
                    <span className="text-[9px] text-white/70 mt-0.5">Instrutor: {lesson.instructor_name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 3: Modules and Chapters Carousel */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold font-outfit px-1">Módulos & Áreas de Foco</h2>
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1">
          {modules.map(mod => {
            const parentCourse = courses.find(c => c.id === mod.course_id);
            const linkUrl = parentCourse ? `/masterclasses/curso/${parentCourse.slug}` : '/masterclasses';

            return (
              <Link 
                key={mod.id} 
                href={linkUrl}
                className="w-[200px] md:w-[240px] aspect-[4/3] rounded-xl overflow-hidden relative flex-shrink-0 snap-start group cursor-pointer no-underline border border-white/5"
              >
                <img src={mod.cover_image_url} alt={mod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-85 z-10" />
                
                <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-1">
                  <span className="badge badge-gray text-[9px] self-start py-0.5 px-1.5">Capítulo</span>
                  <h3 className="text-xs font-bold m-0 leading-tight mt-1 font-outfit text-white">
                    {mod.title}
                  </h3>
                  <p className="text-[9px] text-white/70 leading-normal line-clamp-2 mt-0.5">
                    {mod.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
