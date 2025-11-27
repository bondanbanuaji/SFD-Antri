'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

interface SlideInProps extends Omit<HTMLMotionProps<'div'>, 'direction'> {
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  children: React.ReactNode;
}

export function SlideIn({ 
  direction = 'up', 
  delay = 0, 
  duration = 0.5,
  distance = 20,
  children, 
  ...props 
}: SlideInProps) {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directions[direction] }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
