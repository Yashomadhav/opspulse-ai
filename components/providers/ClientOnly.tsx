"use client";

import React, { useEffect, useState } from "react";

/**
 * ClientOnly — renders children only after client-side hydration is complete.
 *
 * This prevents React hydration mismatches caused by Framer Motion's
 * AnimatePresence + Lucide SVG icons rendering differently on server vs client.
 *
 * Usage: wrap any component tree that uses motion/AnimatePresence in <ClientOnly>.
 */
interface ClientOnlyProps {
  children: React.ReactNode;
  /** Optional fallback to show during SSR / before mount */
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
