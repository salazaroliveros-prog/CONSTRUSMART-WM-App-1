// Componente animado para filas de líneas con Framer Motion
import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

export const AnimatedList = React.forwardRef(function AnimatedListComponent<T>(
  { items, renderItem, keyExtractor, direction = 'left' }: AnimatedListProps<T>,
  _ref: React.Ref<HTMLDivElement>
) {
  const variants = {
    left: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } },
    right: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } },
    top: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } },
    bottom: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } },
  };

  const variant = variants[direction];

  return (
    <motion.div layout>
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item)}
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          transition={{ delay: index * 0.05 }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
});

AnimatedList.displayName = 'AnimatedList';
