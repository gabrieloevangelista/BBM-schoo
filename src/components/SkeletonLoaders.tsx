'use client';

import React from 'react';

/* ============================================================================
   Reusable Skeleton Building Blocks
   ============================================================================ */

interface SkeletonBoxProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBox({ className = '', style = {} }: SkeletonBoxProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

interface SkeletonCardProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  useHudCorners?: boolean;
}

export function SkeletonCard({ children, style = {}, className = '', useHudCorners = true }: SkeletonCardProps) {
  return (
    <div className={`skeleton-card relative overflow-hidden ${className}`} style={style}>
      {useHudCorners && (
        <>
          <div className="hud-corner-tl" style={{ opacity: 0.15, pointerEvents: 'none' }} />
          <div className="hud-corner-br" style={{ opacity: 0.15, pointerEvents: 'none' }} />
        </>
      )}
      <div className="relative z-10 w-full h-full flex flex-col">{children}</div>
    </div>
  );
}

/* ============================================================================
   Dashboard Skeleton
   ============================================================================ */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Welcome Header */}
      <SkeletonCard style={{ padding: '32px' }} useHudCorners={true}>
        <SkeletonBox style={{ height: 28, width: '35%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 14, width: '55%' }} />
      </SkeletonCard>

      {/* 3-col Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
          <div className="flex justify-between items-start mb-4">
            <SkeletonBox style={{ height: 12, width: '45%' }} />
            <SkeletonBox style={{ height: 18, width: 18, borderRadius: '50%' }} />
          </div>
          <SkeletonBox style={{ height: 24, width: '35%', marginBottom: 12 }} />
          <SkeletonBox style={{ height: 10, width: '100%' }} />
        </SkeletonCard>

        <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
          <div className="flex justify-between items-start mb-4">
            <SkeletonBox style={{ height: 12, width: '45%' }} />
            <SkeletonBox style={{ height: 18, width: 18, borderRadius: '50%' }} />
          </div>
          <SkeletonBox style={{ height: 24, width: '30%', marginBottom: 12 }} />
          {/* Segmented Progress bar mock */}
          <div className="flex gap-1 w-full mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBox key={i} style={{ flex: 1, height: 8, borderRadius: 1 }} />
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
          <div className="flex justify-between items-start mb-4">
            <SkeletonBox style={{ height: 12, width: '55%' }} />
            <SkeletonBox style={{ height: 18, width: 18, borderRadius: '50%' }} />
          </div>
          <SkeletonBox style={{ height: 18, width: '80%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 10, width: '40%' }} />
        </SkeletonCard>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Course & Community */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <SkeletonBox style={{ height: 18, width: '30%' }} />
            <SkeletonBox style={{ height: 12, width: '15%' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <SkeletonCard key={i} style={{ padding: 0, overflow: 'hidden' }} useHudCorners={true}>
                <SkeletonBox style={{ height: 120, width: '100%', borderRadius: 0 }} />
                <div style={{ padding: 16 }}>
                  <SkeletonBox style={{ height: 10, width: '20%', marginBottom: 8 }} />
                  <SkeletonBox style={{ height: 14, width: '80%', marginBottom: 8 }} />
                  <SkeletonBox style={{ height: 10, width: '50%' }} />
                </div>
              </SkeletonCard>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Shortcuts */}
        <div className="flex flex-col gap-4">
          <SkeletonBox style={{ height: 18, width: '40%', marginBottom: 4 }} />
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} style={{ padding: 16 }} useHudCorners={true}>
              <div className="flex items-center gap-3">
                <SkeletonBox style={{ height: 32, width: 32, borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <SkeletonBox style={{ height: 12, width: '60%', marginBottom: 6 }} />
                  <SkeletonBox style={{ height: 9, width: '80%' }} />
                </div>
                <SkeletonBox style={{ height: 12, width: 12 }} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Masterclasses Skeleton
   ============================================================================ */
export function MasterclassesSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero Banner */}
      <SkeletonCard style={{ padding: 32, minHeight: 180 }} useHudCorners={true}>
        <SkeletonBox style={{ height: 12, width: '12%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 28, width: '45%', marginBottom: 10 }} />
        <SkeletonBox style={{ height: 14, width: '65%', marginBottom: 20 }} />
        <SkeletonBox style={{ height: 36, width: 140, borderRadius: 8 }} />
      </SkeletonCard>

      {/* Course Cards Grid */}
      <div className="flex justify-between items-center mt-4">
        <SkeletonBox style={{ height: 20, width: '20%' }} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} style={{ padding: 0, overflow: 'hidden' }} useHudCorners={true}>
            <SkeletonBox style={{ height: 160, width: '100%', borderRadius: 0 }} />
            <div style={{ padding: 20 }}>
              <SkeletonBox style={{ height: 14, width: '75%', marginBottom: 8 }} />
              <SkeletonBox style={{ height: 10, width: '90%', marginBottom: 6 }} />
              <SkeletonBox style={{ height: 10, width: '50%' }} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Recursos Skeleton
   ============================================================================ */
export function RecursosSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <SkeletonBox style={{ height: 28, width: '25%' }} />
      <SkeletonBox style={{ height: 12, width: '45%', marginTop: -8 }} />

      {/* Filter bar */}
      <SkeletonCard style={{ padding: 16 }} useHudCorners={true}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <SkeletonBox style={{ height: 38, width: 280, borderRadius: 6 }} />
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map(i => (
              <SkeletonBox key={i} style={{ height: 32, width: 70, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </SkeletonCard>

      {/* Table */}
      <SkeletonCard style={{ padding: 8 }} useHudCorners={true}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {['30%', '20%', '15%', '15%', '10%'].map((w, i) => (
            <SkeletonBox key={i} style={{ height: 10, width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '30%' }}>
              <SkeletonBox style={{ height: 20, width: 20, borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <SkeletonBox style={{ height: 12, width: '85%', marginBottom: 4 }} />
                <SkeletonBox style={{ height: 9, width: '55%' }} />
              </div>
            </div>
            <SkeletonBox style={{ height: 10, width: '20%' }} />
            <SkeletonBox style={{ height: 20, width: 60, borderRadius: 4 }} />
            <SkeletonBox style={{ height: 10, width: '15%' }} />
            <SkeletonBox style={{ height: 28, width: 28, borderRadius: 6, marginLeft: 'auto' }} />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

/* ============================================================================
   Calendario Skeleton
   ============================================================================ */
export function CalendarioSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <SkeletonBox style={{ height: 28, width: 180, marginBottom: 8 }} />
          <SkeletonBox style={{ height: 12, width: 300 }} />
        </div>
        <div className="flex gap-2">
          <SkeletonBox style={{ height: 34, width: 120, borderRadius: 8 }} />
          <SkeletonBox style={{ height: 34, width: 90, borderRadius: 8 }} />
        </div>
      </div>

      {/* Filters */}
      <SkeletonCard style={{ padding: 16 }} useHudCorners={true}>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <SkeletonBox key={i} style={{ height: 30, width: 90, borderRadius: 6 }} />
            ))}
          </div>
          <SkeletonBox style={{ height: 30, width: 80, borderRadius: 6 }} />
        </div>
      </SkeletonCard>

      {/* Calendar Grid */}
      <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
        <div className="flex justify-between items-center mb-6">
          <SkeletonBox style={{ height: 20, width: '15%' }} />
          <div className="flex gap-1">
            <SkeletonBox style={{ height: 30, width: 30, borderRadius: 6 }} />
            <SkeletonBox style={{ height: 30, width: 30, borderRadius: 6 }} />
          </div>
        </div>
        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <SkeletonBox key={i} style={{ height: 10, width: '50%', margin: '0 auto' }} />
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <SkeletonBox key={i} style={{ height: 75, borderRadius: 8 }} />
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

/* ============================================================================
   Comunidade Skeleton
   ============================================================================ */
export function ComunidadeSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <SkeletonBox style={{ height: 28, width: '25%' }} />
      <SkeletonBox style={{ height: 12, width: '45%', marginTop: -8 }} />

      {/* Stories bar */}
      <div className="flex gap-4 overflow-x-hidden py-2">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div style={{ position: 'relative' }}>
              <SkeletonBox style={{ height: 56, width: 56, borderRadius: '50%' }} />
              {i === 1 && <SkeletonBox style={{ position: 'absolute', right: -2, bottom: -2, height: 18, width: 18, borderRadius: '50%' }} />}
            </div>
            <SkeletonBox style={{ height: 8, width: 45 }} />
          </div>
        ))}
      </div>

      {/* Post creator */}
      <SkeletonCard style={{ padding: 16 }} useHudCorners={true}>
        <div className="flex gap-3 items-center mb-4">
          <SkeletonBox style={{ height: 40, width: 40, borderRadius: '50%', flexShrink: 0 }} />
          <SkeletonBox style={{ height: 38, flex: 1, borderRadius: 8 }} />
        </div>
        <div className="flex gap-2">
          <SkeletonBox style={{ height: 32, width: 90, borderRadius: 6 }} />
          <SkeletonBox style={{ height: 32, width: 95, borderRadius: 6 }} />
        </div>
      </SkeletonCard>

      {/* Feed posts */}
      {[1, 2].map(i => (
        <SkeletonCard key={i} style={{ padding: 20 }} useHudCorners={true}>
          <div className="flex gap-3 items-center mb-4">
            <SkeletonBox style={{ height: 40, width: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div>
              <SkeletonBox style={{ height: 12, width: 110, marginBottom: 4 }} />
              <SkeletonBox style={{ height: 9, width: 70 }} />
            </div>
          </div>
          <SkeletonBox style={{ height: 12, width: '95%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 12, width: '85%', marginBottom: 12 }} />
          <SkeletonBox style={{ height: 220, width: '100%', borderRadius: 8, marginBottom: 12 }} />
          <div className="flex gap-4">
            <SkeletonBox style={{ height: 12, width: 50 }} />
            <SkeletonBox style={{ height: 12, width: 50 }} />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/* ============================================================================
   Missoes Skeleton
   ============================================================================ */
export function MissoesSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SkeletonBox style={{ height: 28, width: '20%' }} />
      <SkeletonBox style={{ height: 12, width: '40%', marginTop: -8 }} />

      {/* Performance Card */}
      <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
        <div className="flex justify-between items-center mb-4">
          <SkeletonBox style={{ height: 14, width: '20%' }} />
          <SkeletonBox style={{ height: 14, width: '30%' }} />
        </div>
        {/* Segmented progress bar mock */}
        <div className="flex gap-1 w-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <SkeletonBox key={i} style={{ flex: 1, height: 10, borderRadius: 1 }} />
          ))}
        </div>
      </SkeletonCard>

      {/* Mission accordion items */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} style={{ padding: 16 }} useHudCorners={true}>
            <div className="flex justify-between items-center">
              <div className="flex gap-3 items-center flex-1">
                <SkeletonBox style={{ height: 36, width: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <SkeletonBox style={{ height: 14, width: '45%', marginBottom: 6 }} />
                  <SkeletonBox style={{ height: 10, width: '60%' }} />
                </div>
              </div>
              <SkeletonBox style={{ height: 22, width: 85, borderRadius: 6 }} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Perfil Skeleton
   ============================================================================ */
export function PerfilSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Profile Header */}
      <SkeletonCard style={{ padding: 24 }} useHudCorners={true}>
        <div className="flex flex-col md:flex-row gap-5 items-center">
          <SkeletonBox style={{ height: 80, width: 80, borderRadius: '50%', flexShrink: 0 }} />
          <div className="flex-1 text-center md:text-left">
            <SkeletonBox style={{ height: 20, width: 140, marginBottom: 8, margin: '0 auto md:0' }} />
            <SkeletonBox style={{ height: 12, width: 90, marginBottom: 8, margin: '0 auto md:0' }} />
            <SkeletonBox style={{ height: 10, width: 180, margin: '0 auto md:0' }} />
          </div>
          <SkeletonBox style={{ height: 36, width: 110, borderRadius: 6 }} />
        </div>
      </SkeletonCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} style={{ padding: 16, textAlign: 'center' }} useHudCorners={true}>
            <SkeletonBox style={{ height: 20, width: '40%', margin: '0 auto 6px' }} />
            <SkeletonBox style={{ height: 9, width: '60%', margin: '0 auto' }} />
          </SkeletonCard>
        ))}
      </div>

      {/* Bio/Details */}
      <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
        <SkeletonBox style={{ height: 14, width: '15%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 10, width: '95%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '80%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '65%' }} />
      </SkeletonCard>
    </div>
  );
}

/* ============================================================================
   Admin / Generic Table Skeleton
   ============================================================================ */
export function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <SkeletonBox style={{ height: 28, width: 180, marginBottom: 8 }} />
          <SkeletonBox style={{ height: 12, width: 240 }} />
        </div>
        <SkeletonBox style={{ height: 36, width: 130, borderRadius: 8 }} />
      </div>

      <SkeletonCard style={{ padding: 8 }} useHudCorners={true}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <SkeletonBox style={{ height: 36, width: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <SkeletonBox style={{ height: 12, width: '35%', marginBottom: 4 }} />
              <SkeletonBox style={{ height: 9, width: '55%' }} />
            </div>
            <SkeletonBox style={{ height: 22, width: 75, borderRadius: 4 }} />
            <SkeletonBox style={{ height: 28, width: 28, borderRadius: 6 }} />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

/* ============================================================================
   Course Detail Skeleton
   ============================================================================ */
export function CourseDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Course Header */}
      <SkeletonCard style={{ padding: 24 }} useHudCorners={true}>
        <SkeletonBox style={{ height: 12, width: '10%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 28, width: '40%', marginBottom: 10 }} />
        <SkeletonBox style={{ height: 14, width: '60%', marginBottom: 16 }} />
        <div className="flex gap-4">
          <SkeletonBox style={{ height: 10, width: 80 }} />
          <SkeletonBox style={{ height: 10, width: 80 }} />
        </div>
      </SkeletonCard>

      {/* Modules list */}
      <div className="flex flex-col gap-6">
        {[1, 2].map(i => (
          <SkeletonCard key={i} style={{ padding: 20 }} useHudCorners={true}>
            <SkeletonBox style={{ height: 16, width: '30%', marginBottom: 16 }} />
            {[1, 2, 3].map(j => (
              <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <SkeletonBox style={{ height: 32, width: 32, borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <SkeletonBox style={{ height: 12, width: '45%', marginBottom: 4 }} />
                  <SkeletonBox style={{ height: 9, width: '25%' }} />
                </div>
                <SkeletonBox style={{ height: 12, width: 12 }} />
              </div>
            ))}
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Lesson Detail Skeleton
   ============================================================================ */
export function LessonDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Video Player */}
      <SkeletonBox style={{ height: 380, width: '100%', borderRadius: 12 }} />

      {/* Lesson Info */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div style={{ flex: 1, minWidth: 280 }}>
          <SkeletonBox style={{ height: 24, width: '50%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 12, width: '70%', marginBottom: 6 }} />
          <SkeletonBox style={{ height: 12, width: '40%' }} />
        </div>
        <SkeletonBox style={{ height: 36, width: 130, borderRadius: 6 }} />
      </div>

      {/* Description */}
      <SkeletonCard style={{ padding: 20 }} useHudCorners={true}>
        <SkeletonBox style={{ height: 14, width: '15%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 10, width: '95%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '80%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '60%' }} />
      </SkeletonCard>
    </div>
  );
}

/* ============================================================================
   Projetos Skeleton
   ============================================================================ */
export function ProjetosSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SkeletonBox style={{ height: 28, width: '20%' }} />
      <SkeletonBox style={{ height: 12, width: '45%', marginTop: -8 }} />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} style={{ padding: 16 }} useHudCorners={true}>
            <SkeletonBox style={{ height: 140, width: '100%', borderRadius: 8, marginBottom: 12 }} />
            <SkeletonBox style={{ height: 16, width: '55%', marginBottom: 8 }} />
            <SkeletonBox style={{ height: 10, width: '75%', marginBottom: 6 }} />
            <SkeletonBox style={{ height: 10, width: '35%', marginBottom: 12 }} />
            <SkeletonBox style={{ height: 8, width: '100%', borderRadius: 999 }} />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Oportunidades Skeleton
   ============================================================================ */
export function OportunidadesSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SkeletonBox style={{ height: 28, width: '25%' }} />
      <SkeletonBox style={{ height: 12, width: '45%', marginTop: -8 }} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} style={{ padding: 20 }} useHudCorners={true}>
            <div className="flex justify-between items-center mb-4">
              <SkeletonBox style={{ height: 20, width: 70, borderRadius: 4 }} />
              <SkeletonBox style={{ height: 20, width: 50, borderRadius: 4 }} />
            </div>
            <SkeletonBox style={{ height: 16, width: '60%', marginBottom: 8 }} />
            <SkeletonBox style={{ height: 10, width: '90%', marginBottom: 6 }} />
            <SkeletonBox style={{ height: 10, width: '70%', marginBottom: 16 }} />
            <SkeletonBox style={{ height: 36, width: '100%', borderRadius: 6 }} />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
