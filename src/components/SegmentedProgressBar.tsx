'use client';

import React from 'react';

interface SegmentedProgressBarProps {
  /** Number of filled segments */
  filled: number;
  /** Total number of segments */
  total: number;
  /** Total segments to render (defaults to 16) */
  segments?: number;
}

/**
 * HUD Sci-Fi segmented progress bar.
 * Matches the user's screenshot style: an outer border container containing discrete segmented blocks.
 */
export default function SegmentedProgressBar({ filled, total, segments = 16 }: SegmentedProgressBarProps) {
  // Ensure we don't divide by zero
  const safeTotal = Math.max(total || 1, 1);
  const safeFilled = Math.max(filled || 0, 0);
  
  // Calculate how many blocks should be filled
  const filledCount = Math.min(
    Math.round((safeFilled / safeTotal) * segments),
    segments
  );

  return (
    <div 
      style={{
        width: '100%',
        padding: '3px',
        border: '1px solid var(--color-input-border)',
        borderRadius: '2px',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        gap: '3px'
      }}
    >
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled = i < filledCount;
        
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: '10px',
              backgroundColor: isFilled 
                ? 'var(--color-primary-lemon)' 
                : 'rgba(255, 255, 255, 0.08)',
              borderRadius: '1px',
              transition: 'background-color 0.3s ease'
            }}
            className={isFilled ? 'bg-primary-lemon-important' : 'bg-empty-segment-important'}
          />
        );
      })}
    </div>
  );
}
