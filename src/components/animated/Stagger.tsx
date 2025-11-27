'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerProps {
  children: ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export function Stagger({ 
  children, 
  delay = 0,
  staggerDelay = 0.1,
  className 
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
