/**
 * Centralized Motion Tokens & Configuration for CEO OS
 * As specified in Master Production Specification:
 * Micro: 80–150ms | Fast: 150–220ms | Normal: 250–400ms | Slow: 400–600ms | Celebration: 600–1200ms
 */

export const MOTION_DURATIONS = {
  micro: 0.12, // 120ms
  fast: 0.18,  // 180ms
  normal: 0.3, // 300ms
  slow: 0.45,  // 450ms
  celebration: 0.9, // 900ms
} as const;

export const MOTION_EASINGS = {
  standard: [0.2, 0.8, 0.2, 1], // cubic-bezier(0.2, 0.8, 0.2, 1)
  enter: [0.16, 1, 0.3, 1],      // cubic-bezier(0.16, 1, 0.3, 1)
  exit: [0.4, 0, 1, 1],         // cubic-bezier(0.4, 0, 1, 1)
} as const;

export const MOTION_SPRINGS = {
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
    mass: 0.7,
  },
  soft: {
    type: 'spring',
    stiffness: 280,
    damping: 28,
    mass: 0.8,
  },
  celebration: {
    type: 'spring',
    stiffness: 350,
    damping: 18,
    mass: 0.7,
  },
} as const;

export const VARIANTS = {
  taskCardEntrance: {
    initial: { opacity: 0, scale: 0.96, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, height: 0, y: -10, marginBottom: 0, transition: { duration: 0.28, ease: MOTION_EASINGS.exit } },
    transition: { duration: 0.32, ease: MOTION_EASINGS.enter },
  },
  taskCardMobileEntrance: {
    initial: { opacity: 0, scale: 0.94, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, height: 0, y: -10, marginBottom: 0, transition: { duration: 0.28, ease: MOTION_EASINGS.exit } },
    transition: { duration: 0.35, ease: MOTION_EASINGS.enter },
  },
  modalSheet: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
    transition: MOTION_SPRINGS.snappy,
  },
  toast: {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.95 },
    transition: { duration: 0.25, ease: MOTION_EASINGS.enter },
  },
  buttonPress: {
    scale: 0.97,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
} as const;
