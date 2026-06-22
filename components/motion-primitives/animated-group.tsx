'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGroupProps {
  children: React.ReactNode;
  variants?: {
    container?: any;
    item?: any;
  };
  className?: string;
}

export function AnimatedGroup({
  children,
  variants,
  className,
}: AnimatedGroupProps) {
  const defaultVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', bounce: 0.3 },
      },
    },
  };

  const finalVariants = variants || defaultVariants;

  return (
    <motion.div
      variants={finalVariants.container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={finalVariants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
