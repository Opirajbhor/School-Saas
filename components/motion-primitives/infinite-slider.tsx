'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface InfiniteSliderProps {
  children: React.ReactNode;
  duration?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function InfiniteSlider({
  children,
  duration = 20,
  direction = 'left',
  className,
}: InfiniteSliderProps) {
  const isLeft = direction === 'left';

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-4"
        animate={{
          x: isLeft ? [0, -500] : [500, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
