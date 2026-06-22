'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TextEffectProps {
  children: string;
  preset?: 'fade-in-blur' | 'fade-in' | 'blur-in';
  speedSegment?: number;
  delay?: number;
  per?: 'word' | 'line' | 'char';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  className?: string;
}

export function TextEffect({
  children,
  preset = 'fade-in',
  speedSegment = 0.1,
  delay = 0,
  per = 'char',
  as: Component = 'div',
  className,
}: TextEffectProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: speedSegment,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      filter: preset === 'fade-in-blur' ? 'blur(12px)' : 'blur(0px)',
      y: preset === 'fade-in-blur' ? 12 : 0,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const segments = per === 'line' ? children.split('\n') : children.split(' ');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
      as={Component}
    >
      {segments.map((segment, i) => (
        <motion.span key={i} variants={itemVariants}>
          {segment}
          {per !== 'line' && i < segments.length - 1 && ' '}
        </motion.span>
      ))}
    </motion.div>
  );
}
