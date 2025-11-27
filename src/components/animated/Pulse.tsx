'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PulseProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  duration?: number;
}

export function Pulse({ 
  children, 
  className,
  scale = 1.05,
  duration = 2
}: PulseProps) {
  return (
    <motion.div
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
