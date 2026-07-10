'use client';

import React from 'react';

/* ============================================================================
   Reusable Skeleton Building Blocks
   ============================================================================ */

function SkeletonBox({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/* ============================================================================
   Dashboard Skeleton
   ============================================================================ */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div className="skeleton-card" style={{ padding: '32px' }}>
        <SkeletonBox style={{ height: 28, width: '45%', marginBottom: 10 }} />
        <SkeletonBox style={{ height: 14, width: '60%' }} />
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
        <div className="skeleton-card" style={{ padding: 24 }}>
          <SkeletonBox style={{ height: 16, width: '40%', marginBottom: 20 }} />
          <SkeletonBox style={{ height: 10, width: '100%', marginBottom: 12 }} />
          <SkeletonBox style={{ height: 8, width: '100%', borderRadius: 999 }} />
          <div style={{ marginTop: 24 }}>
            <SkeletonBox style={{ height: 60, width: '100%', borderRadius: 12 }} />
          </div>
        </div>
        <div className="skeleton-card" style={{ padding: 24 }}>
          <SkeletonBox style={{ height: 16, width: '50%', marginBottom: 20 }} />
          <SkeletonBox style={{ height: 80, width: '100%', borderRadius: 12 }} />
        </div>
      </div>

      {/* Shortcuts */}
      <SkeletonBox style={{ height: 18, width: '30%', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        <div className="skeleton-card" style={{ padding: 20 }}>
          <SkeletonBox style={{ height: 24, width: 24, borderRadius: 6, marginBottom: 12 }} />
          <SkeletonBox style={{ height: 14, width: '50%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 10, width: '80%' }} />
        </div>
        <div className="skeleton-card" style={{ padding: 20 }}>
          <SkeletonBox style={{ height: 24, width: 24, borderRadius: 6, marginBottom: 12 }} />
          <SkeletonBox style={{ height: 14, width: '50%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 10, width: '80%' }} />
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
    <div className="flex flex-col gap-8">
      {/* Hero Banner */}
      <div className="skeleton-card" style={{ padding: 32, minHeight: 180 }}>
        <SkeletonBox style={{ height: 12, width: '15%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 28, width: '55%', marginBottom: 10 }} />
        <SkeletonBox style={{ height: 14, width: '70%', marginBottom: 20 }} />
        <SkeletonBox style={{ height: 36, width: 160, borderRadius: 8 }} />
      </div>

      {/* Course Cards Grid */}
      <SkeletonBox style={{ height: 20, width: '25%', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: 0, overflow: 'hidden' }}>
            <SkeletonBox style={{ height: 160, width: '100%', borderRadius: 0 }} />
            <div style={{ padding: 20 }}>
              <SkeletonBox style={{ height: 14, width: '70%', marginBottom: 8 }} />
              <SkeletonBox style={{ height: 10, width: '90%', marginBottom: 6 }} />
              <SkeletonBox style={{ height: 10, width: '50%' }} />
            </div>
          </div>
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
    <div className="flex flex-col gap-6">
      {/* Title */}
      <SkeletonBox style={{ height: 28, width: '35%' }} />
      <SkeletonBox style={{ height: 12, width: '55%', marginTop: -8 }} />

      {/* Filter bar */}
      <div className="skeleton-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox style={{ height: 38, width: 300, borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <SkeletonBox key={i} style={{ height: 32, width: 80, borderRadius: 8 }} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="skeleton-card" style={{ padding: 10 }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 16, padding: '15px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['25%', '20%', '10%', '10%', '10%'].map((w, i) => (
            <SkeletonBox key={i} style={{ height: 10, width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '15px 12px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '25%' }}>
              <SkeletonBox style={{ height: 18, width: 18, borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <SkeletonBox style={{ height: 12, width: '80%', marginBottom: 4 }} />
                <SkeletonBox style={{ height: 9, width: '60%' }} />
              </div>
            </div>
            <SkeletonBox style={{ height: 10, width: '20%' }} />
            <SkeletonBox style={{ height: 20, width: 50, borderRadius: 4 }} />
            <SkeletonBox style={{ height: 10, width: '10%' }} />
            <SkeletonBox style={{ height: 28, width: 28, borderRadius: 6, marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Calendario Skeleton
   ============================================================================ */
export function CalendarioSkeleton() {
  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <SkeletonBox style={{ height: 28, width: '30%' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <SkeletonBox style={{ height: 34, width: 140, borderRadius: 8 }} />
          <SkeletonBox style={{ height: 34, width: 110, borderRadius: 8 }} />
        </div>
      </div>
      <SkeletonBox style={{ height: 12, width: '50%', marginBottom: 24 }} />

      {/* Filters */}
      <div className="skeleton-card" style={{ padding: 16, marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <SkeletonBox key={i} style={{ height: 30, width: 100, borderRadius: 8 }} />
          ))}
        </div>
        <SkeletonBox style={{ height: 30, width: 70, borderRadius: 8 }} />
      </div>

      {/* Calendar Grid */}
      <div className="skeleton-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <SkeletonBox style={{ height: 20, width: '20%' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <SkeletonBox style={{ height: 32, width: 32, borderRadius: 8 }} />
            <SkeletonBox style={{ height: 32, width: 32, borderRadius: 8 }} />
          </div>
        </div>
        {/* Weekday labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <SkeletonBox key={i} style={{ height: 10, width: '60%', margin: '0 auto' }} />
          ))}
        </div>
        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <SkeletonBox key={i} style={{ height: 80, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Comunidade Skeleton
   ============================================================================ */
export function ComunidadeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <SkeletonBox style={{ height: 28, width: '35%' }} />
      <SkeletonBox style={{ height: 12, width: '55%', marginTop: -8 }} />

      {/* Stories bar */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'hidden', padding: '10px 0' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <SkeletonBox style={{ height: 60, width: 60, borderRadius: '50%' }} />
            <SkeletonBox style={{ height: 8, width: 50 }} />
          </div>
        ))}
      </div>

      {/* Post creator */}
      <div className="skeleton-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <SkeletonBox style={{ height: 40, width: 40, borderRadius: '50%' }} />
          <SkeletonBox style={{ height: 38, flex: 1, borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SkeletonBox style={{ height: 32, width: 100, borderRadius: 8 }} />
          <SkeletonBox style={{ height: 32, width: 100, borderRadius: 8 }} />
        </div>
      </div>

      {/* Feed posts */}
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <SkeletonBox style={{ height: 40, width: 40, borderRadius: '50%' }} />
            <div>
              <SkeletonBox style={{ height: 12, width: 120, marginBottom: 4 }} />
              <SkeletonBox style={{ height: 9, width: 80 }} />
            </div>
          </div>
          <SkeletonBox style={{ height: 12, width: '90%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 12, width: '70%', marginBottom: 16 }} />
          <SkeletonBox style={{ height: 180, width: '100%', borderRadius: 8, marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 20 }}>
            <SkeletonBox style={{ height: 10, width: 60 }} />
            <SkeletonBox style={{ height: 10, width: 60 }} />
            <SkeletonBox style={{ height: 10, width: 60 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Missoes Skeleton
   ============================================================================ */
export function MissoesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBox style={{ height: 28, width: '30%' }} />
      <SkeletonBox style={{ height: 12, width: '50%', marginTop: -8 }} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: 20, textAlign: 'center' }}>
            <SkeletonBox style={{ height: 28, width: '40%', margin: '0 auto 8px' }} />
            <SkeletonBox style={{ height: 10, width: '60%', margin: '0 auto' }} />
          </div>
        ))}
      </div>

      {/* Mission accordion items */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
              <SkeletonBox style={{ height: 36, width: 36, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <SkeletonBox style={{ height: 14, width: '50%', marginBottom: 6 }} />
                <SkeletonBox style={{ height: 10, width: '70%' }} />
              </div>
            </div>
            <SkeletonBox style={{ height: 22, width: 80, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Perfil Skeleton
   ============================================================================ */
export function PerfilSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Profile Header */}
      <div className="skeleton-card" style={{ padding: 32, display: 'flex', gap: 24, alignItems: 'center' }}>
        <SkeletonBox style={{ height: 90, width: 90, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonBox style={{ height: 22, width: '35%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 12, width: '20%', marginBottom: 8 }} />
          <SkeletonBox style={{ height: 10, width: '50%' }} />
        </div>
        <SkeletonBox style={{ height: 36, width: 120, borderRadius: 8 }} />
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: 20, textAlign: 'center' }}>
            <SkeletonBox style={{ height: 24, width: '40%', margin: '0 auto 8px' }} />
            <SkeletonBox style={{ height: 10, width: '60%', margin: '0 auto' }} />
          </div>
        ))}
      </div>

      {/* Bio/Details */}
      <div className="skeleton-card" style={{ padding: 24 }}>
        <SkeletonBox style={{ height: 16, width: '20%', marginBottom: 16 }} />
        <SkeletonBox style={{ height: 10, width: '90%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '75%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '60%' }} />
      </div>
    </div>
  );
}

/* ============================================================================
   Admin / Generic Table Skeleton
   ============================================================================ */
export function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox style={{ height: 28, width: '30%' }} />
        <SkeletonBox style={{ height: 36, width: 150, borderRadius: 8 }} />
      </div>
      <SkeletonBox style={{ height: 12, width: '50%', marginTop: -8 }} />

      <div className="skeleton-card" style={{ padding: 10 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '15px 12px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <SkeletonBox style={{ height: 36, width: 36, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <SkeletonBox style={{ height: 12, width: '40%', marginBottom: 4 }} />
              <SkeletonBox style={{ height: 9, width: '60%' }} />
            </div>
            <SkeletonBox style={{ height: 22, width: 80, borderRadius: 4 }} />
            <SkeletonBox style={{ height: 28, width: 28, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Course Detail Skeleton
   ============================================================================ */
export function CourseDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Course Header */}
      <div className="skeleton-card" style={{ padding: 32 }}>
        <SkeletonBox style={{ height: 12, width: '15%', marginBottom: 12 }} />
        <SkeletonBox style={{ height: 28, width: '50%', marginBottom: 10 }} />
        <SkeletonBox style={{ height: 14, width: '70%', marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <SkeletonBox style={{ height: 10, width: 100 }} />
          <SkeletonBox style={{ height: 10, width: 100 }} />
        </div>
      </div>

      {/* Modules list */}
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-card" style={{ padding: 20 }}>
          <SkeletonBox style={{ height: 16, width: '35%', marginBottom: 16 }} />
          {[1, 2, 3].map(j => (
            <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <SkeletonBox style={{ height: 32, width: 32, borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <SkeletonBox style={{ height: 12, width: '50%', marginBottom: 4 }} />
                <SkeletonBox style={{ height: 9, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Lesson Detail Skeleton
   ============================================================================ */
export function LessonDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Video Player */}
      <SkeletonBox style={{ height: 400, width: '100%', borderRadius: 12 }} />

      {/* Lesson Info */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <SkeletonBox style={{ height: 24, width: '60%', marginBottom: 10 }} />
          <SkeletonBox style={{ height: 12, width: '80%', marginBottom: 6 }} />
          <SkeletonBox style={{ height: 12, width: '50%' }} />
        </div>
        <SkeletonBox style={{ height: 36, width: 140, borderRadius: 8 }} />
      </div>

      {/* Description */}
      <div className="skeleton-card" style={{ padding: 24 }}>
        <SkeletonBox style={{ height: 16, width: '20%', marginBottom: 16 }} />
        <SkeletonBox style={{ height: 10, width: '95%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '85%', marginBottom: 8 }} />
        <SkeletonBox style={{ height: 10, width: '70%' }} />
      </div>
    </div>
  );
}

/* ============================================================================
   Projetos Skeleton
   ============================================================================ */
export function ProjetosSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBox style={{ height: 28, width: '35%' }} />
      <SkeletonBox style={{ height: 12, width: '50%', marginTop: -8 }} />

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: 20 }}>
            <SkeletonBox style={{ height: 160, width: '100%', borderRadius: 8, marginBottom: 16 }} />
            <SkeletonBox style={{ height: 16, width: '60%', marginBottom: 8 }} />
            <SkeletonBox style={{ height: 10, width: '80%', marginBottom: 6 }} />
            <SkeletonBox style={{ height: 10, width: '40%', marginBottom: 16 }} />
            <SkeletonBox style={{ height: 8, width: '100%', borderRadius: 999 }} />
          </div>
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
    <div className="flex flex-col gap-6">
      <SkeletonBox style={{ height: 28, width: '40%' }} />
      <SkeletonBox style={{ height: 12, width: '55%', marginTop: -8 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <SkeletonBox style={{ height: 22, width: 80, borderRadius: 4 }} />
              <SkeletonBox style={{ height: 22, width: 60, borderRadius: 4 }} />
            </div>
            <SkeletonBox style={{ height: 18, width: '60%', marginBottom: 10 }} />
            <SkeletonBox style={{ height: 10, width: '90%', marginBottom: 6 }} />
            <SkeletonBox style={{ height: 10, width: '70%', marginBottom: 20 }} />
            <SkeletonBox style={{ height: 36, width: '100%', borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
