'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  href: string;
  moduleNumber?: number;
  lessonCount?: number;
  actionLabel?: string;
  className?: string;
}

export function ModuleCard({
  title,
  description,
  imageUrl,
  href,
  moduleNumber,
  lessonCount,
  actionLabel = 'Acessar Módulo',
  className = '',
}: ModuleCardProps) {
  return (
    <div
      className={`group w-[260px] sm:w-[290px] md:w-[320px] h-[380px] md:h-[400px] flex-shrink-0 snap-start select-none ${className}`}
    >
      <Link
        href={href}
        aria-label={`Acessar módulo: ${title}`}
        className="relative flex flex-col justify-end w-full h-full rounded-2xl overflow-hidden border border-white/10 
                   transition-all duration-500 ease-out no-underline
                   group-hover:border-[#C1FF07]/40 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
      >
        {/* Background Image with smooth Parallax/Zoom on hover (maintaining current bg) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />

        {/* Sophisticated Dark Vignette Gradient (Card-21 aesthetic) */}
        <div
          className="absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(to top, rgba(8, 8, 10, 0.98) 0%, rgba(8, 8, 10, 0.82) 42%, rgba(8, 8, 10, 0.3) 72%, transparent 100%)',
          }}
        />

        {/* Card Content Overlay */}
        <div className="relative z-20 flex flex-col justify-end h-full p-5 md:p-6 text-white">
          {/* Metadata pill & stats */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C1FF07] font-outfit px-2 py-0.5 rounded bg-[#C1FF07]/15 border border-[#C1FF07]/30">
              {moduleNumber ? `Módulo ${moduleNumber}` : 'MÓDULO'}
            </span>

            {typeof lessonCount === 'number' && (
              <span className="flex items-center gap-1 text-[11px] text-white/70 font-medium font-outfit">
                <BookOpen size={11} className="text-white/50" />
                {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
              </span>
            )}
          </div>

          {/* Module Title */}
          <h3 className="text-lg md:text-xl font-bold tracking-tight font-outfit text-white leading-snug m-0 line-clamp-2 drop-shadow-md group-hover:text-white">
            {title}
          </h3>

          {/* Module Description */}
          {description && (
            <p className="text-xs text-white/70 mt-1.5 font-normal leading-relaxed line-clamp-2 m-0">
              {description}
            </p>
          )}

          {/* Card-21 Signature Glass Action Button */}
          <div
            className="mt-4 md:mt-5 flex items-center justify-between bg-white/[0.07] backdrop-blur-md 
                       border border-white/10 rounded-xl px-4 py-2.5 
                       transition-all duration-300 
                       group-hover:bg-[#C1FF07]/15 group-hover:border-[#C1FF07]/40"
          >
            <span className="text-xs font-semibold tracking-wide text-white group-hover:text-[#C1FF07] transition-colors">
              {actionLabel}
            </span>
            <ArrowRight className="h-4 w-4 text-white/70 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#C1FF07]" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ModuleCard;
