'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCheckmarkProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export function AnimatedCheckmark({
  checked,
  onToggle,
  size = 22,
  className = '',
  disabled = false,
}: AnimatedCheckmarkProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      className={`relative flex items-center justify-center rounded-xl border transition-colors focus:outline-none ${
        checked
          ? 'border-emerald-500 bg-emerald-500 text-black shadow-sm'
          : 'border-border bg-card/80 hover:border-primary/60 text-transparent'
      } ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-checked={checked}
      role="checkbox"
    >
      <motion.svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ scale: checked ? 1 : 0.6, opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.path
          d="M20 6L9 17l-5-5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.button>
  );
}
