'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  actionLabel = 'INICIAR MÓDULO',
  className = '',
}: ModuleCardProps) {
  const modCode = moduleNumber ? String(moduleNumber).padStart(2, '0') : '01';

  return (
    <div
      className={`group w-[260px] sm:w-[290px] md:w-[320px] h-[380px] md:h-[410px] flex-shrink-0 snap-start select-none relative ${className}`}
    >
      <Link
        href={href}
        aria-label={`Acessar módulo: ${title}`}
        className="relative flex flex-col justify-end w-full h-full rounded-none overflow-hidden 
                   border border-white/15 bg-[#08080c] transition-all duration-300 no-underline
                   group-hover:border-[#C1FF07]/70 group-hover:shadow-[0_0_25px_rgba(193,255,7,0.15)]"
      >
        {/* Sci-Fi Corner Tech Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C1FF07]/80 z-30 pointer-events-none transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-[#C1FF07]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C1FF07]/80 z-30 pointer-events-none transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-[#C1FF07]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C1FF07]/80 z-30 pointer-events-none transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-[#C1FF07]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C1FF07]/80 z-30 pointer-events-none transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-[#C1FF07]" />

        {/* Top Tech Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 px-3 py-2 flex items-center justify-between bg-black/60 backdrop-blur-sm border-b border-white/10 pointer-events-none">
          <span className="font-mono text-[9px] font-bold tracking-widest text-[#C1FF07] uppercase">
            // MOD_{modCode}
          </span>
          <span className="font-mono text-[9px] text-white/50 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-none bg-[#C1FF07] animate-pulse" />
            ONLINE
          </span>
        </div>

        {/* Background Image with smooth Zoom on hover */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />

        {/* High-Tech Grid Pattern Overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Sci-Fi Vignette Gradient */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(to top, rgba(5, 5, 8, 0.98) 0%, rgba(5, 5, 8, 0.85) 45%, rgba(5, 5, 8, 0.25) 75%, transparent 100%)',
          }}
        />

        {/* Card Content Overlay */}
        <div className="relative z-20 flex flex-col justify-end h-full p-5 text-white">
          {/* Metadata pill & stats */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C1FF07] px-2 py-0.5 rounded-none bg-[#C1FF07]/10 border border-[#C1FF07]/30">
              SYS // MÓDULO {modCode}
            </span>

            {typeof lessonCount === 'number' && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-[10px] text-white/70 tracking-wider px-2 py-0.5 rounded-none bg-black/60 border border-white/10 flex items-center gap-1 cursor-default hover:text-[#C1FF07] hover:border-[#C1FF07]/40 transition-colors">
                      <Terminal size={10} className="text-[#C1FF07]" />
                      {lessonCount} {lessonCount === 1 ? 'AULA' : 'AULAS'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow className="rounded-none font-mono text-[11px] border border-[#C1FF07]/40 bg-[#0a0a0e]">
                    <span>STATUS: {lessonCount} UNIDADES DE CONTEÚDO LIBERADAS</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Module Title */}
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight font-outfit text-white uppercase leading-snug m-0 line-clamp-2 drop-shadow-md group-hover:text-white">
            {title}
          </h3>

          {/* Module Description */}
          {description && (
            <p className="text-xs text-white/60 mt-1.5 font-normal leading-relaxed line-clamp-2 m-0 font-sans">
              {description}
            </p>
          )}

          {/* Sci-Fi High-Tech Action Button */}
          <div
            className="mt-4 flex items-center justify-between rounded-none px-4 py-2.5 
                       border border-white/20 bg-black/70 backdrop-blur-md text-white
                       transition-all duration-300 
                       group-hover:border-[#C1FF07] group-hover:bg-[#C1FF07] group-hover:text-black"
          >
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase transition-colors">
              {actionLabel}
            </span>
            <ArrowRight className="h-3.5 w-3.5 transform transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ModuleCard;
