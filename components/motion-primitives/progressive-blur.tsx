'use client';

import React from 'react';

// 1. Updated interface to match the exact props you are passing
interface ProgressiveBlurProps {
  children?: React.ReactNode; // Made optional if you only use it as a standalone mask overlay
  className?: string;
  direction?: 'left' | 'right' | 'top' | 'bottom'; // Matches direction="left" / direction="right"
  blurIntensity?: number; // Matches blurIntensity={1}
}

export function ProgressiveBlur({
  children,
  className,
  direction = 'left', // Fallback default value
  blurIntensity = 1,  // Fallback default value
}: ProgressiveBlurProps) {
  
  // 2. Compute CSS linear-gradient values dynamically based on direction prop
  const getGradientDirection = () => {
    switch (direction) {
      case 'left':
        return 'to left';
      case 'right':
        return 'to right';
      case 'top':
        return 'to top';
      case 'bottom':
        return 'to bottom';
      default:
        return 'to left';
    }
  };

  // Adjust transparency tracking dynamically if you plan to use blurIntensity later
  const gradientValue = `linear-gradient(${getGradientDirection()}, black 0%, black ${80 * blurIntensity}%, transparent 100%)`;

  return (
    <div
      className={className}
      style={{
        maskImage: gradientValue,
        WebkitMaskImage: gradientValue,
      }}
    >
      {children}
    </div>
  );
}