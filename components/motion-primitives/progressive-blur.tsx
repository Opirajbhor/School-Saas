'use client';

import React from 'react';

interface ProgressiveBlurProps {
  children: React.ReactNode;
  className?: string;
}

export function ProgressiveBlur({
  children,
  className,
}: ProgressiveBlurProps) {
  return (
    <div
      className={className}
      style={{
        maskImage: 'linear-gradient(to right, black 0%, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, black 0%, black 80%, transparent 100%)',
      }}
    >
      {children}
    </div>
  );
}
