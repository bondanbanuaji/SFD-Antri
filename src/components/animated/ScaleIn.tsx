'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  scale?: number;
  children: React.ReactNode;
}

export function ScaleIn({ 
  delay = 0, 
  duration = 0.5,
  scale = 0.9,
  children, 
  ...props 
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
