/**
 * OpsPulse AI — Framer Motion Animation Variants
 * Centralised animation config for consistent, performant animations
 * across the entire platform.
 */

import type { Variants, Transition } from "framer-motion";

// ─────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────

export const springSmooth: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 25,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 28,
};

export const easeFast: Transition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.2,
};

export const easeMedium: Transition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.35,
};

export const easeSlow: Transition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.5,
};

// ─────────────────────────────────────────────
// PAGE / SECTION VARIANTS
// ─────────────────────────────────────────────

/** Full page entrance — fades up from slightly below */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/** Container that staggers its children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/** Faster stagger for dense lists (alerts, recommendations) */
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/** Slower stagger for large chart sections */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ─────────────────────────────────────────────
// CARD / ITEM VARIANTS
// ─────────────────────────────────────────────

/** Standard card entrance — fade + slide up */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: easeFast,
  },
};

/** Slide in from the right — for alert feed items */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.97,
    transition: easeFast,
  },
};

/** Slide in from left — for sidebar items */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: easeFast,
  },
};

/** Fade in only — for subtle elements */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: easeMedium,
  },
  exit: {
    opacity: 0,
    transition: easeFast,
  },
};

/** Scale pop — for badges, icons, status indicators */
export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: easeFast,
  },
};

/** Expand from top — for dropdown/accordion content */
export const expandDown: Variants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ─────────────────────────────────────────────
// INTERACTIVE HOVER / TAP VARIANTS
// ─────────────────────────────────────────────

/** Card hover — subtle lift + shadow */
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    transition: springSmooth,
  },
  hover: {
    scale: 1.015,
    y: -2,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    transition: springSmooth,
  },
  tap: {
    scale: 0.99,
    y: 0,
    transition: springSmooth,
  },
};

/** Button hover — scale */
export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.04, transition: springSmooth },
  tap: { scale: 0.96, transition: springSmooth },
};

/** Icon hover — rotate + scale */
export const iconHover = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: 15, scale: 1.15, transition: springBouncy },
};

// ─────────────────────────────────────────────
// SIDEBAR VARIANTS
// ─────────────────────────────────────────────

export const sidebarVariants: Variants = {
  expanded: {
    width: 256,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  collapsed: {
    width: 64,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const sidebarLabelVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    width: "auto",
    transition: { delay: 0.05, duration: 0.2, ease: "easeOut" },
  },
  collapsed: {
    opacity: 0,
    x: -8,
    width: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const sidebarNavItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 400,
      damping: 28,
    },
  }),
};

// ─────────────────────────────────────────────
// PROGRESS / BAR VARIANTS
// ─────────────────────────────────────────────

/** Animated progress bar fill */
export const progressBarVariants: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (pct: number) => ({
    scaleX: pct / 100,
    originX: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 },
  }),
};

/** Risk score circle fill */
export const riskCircleVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (pct: number) => ({
    pathLength: pct / 100,
    opacity: 1,
    transition: { duration: 1, ease: "easeOut", delay: 0.3 },
  }),
};

// ─────────────────────────────────────────────
// ALERT / NOTIFICATION VARIANTS
// ─────────────────────────────────────────────

/** Critical alert — pulsing glow */
export const criticalPulse: Variants = {
  initial: { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(239, 68, 68, 0)",
      "0 0 0 6px rgba(239, 68, 68, 0.15)",
      "0 0 0 0 rgba(239, 68, 68, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/** Warning alert — amber glow */
export const warningPulse: Variants = {
  initial: { boxShadow: "0 0 0 0 rgba(245, 158, 11, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(245, 158, 11, 0)",
      "0 0 0 4px rgba(245, 158, 11, 0.12)",
      "0 0 0 0 rgba(245, 158, 11, 0)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ─────────────────────────────────────────────
// CHART SECTION VARIANTS
// ─────────────────────────────────────────────

export const chartEntranceVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─────────────────────────────────────────────
// NUMBER COUNTER HELPERS
// ─────────────────────────────────────────────

/**
 * Easing function for number counter animation.
 * Returns value between 0 and 1 for a given progress t (0–1).
 */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Interpolates from `from` to `to` using easeOutExpo.
 */
export function interpolateNumber(from: number, to: number, t: number): number {
  return from + (to - from) * easeOutExpo(t);
}
