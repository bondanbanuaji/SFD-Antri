'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  hover?: boolean;
  delay?: number;
}

export function AnimatedCard({ 
  children, 
  hover = true,
  delay = 0,
  className,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      {...props}
    >
      <Card className={cn('transition-shadow duration-300', className)}>
        {children}
      </Card>
    </motion.div>
  );
}
