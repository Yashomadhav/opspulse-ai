"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ClientOnly } from "@/components/providers/ClientOnly";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Skeleton shown during SSR / before client hydration.
 * Prevents Framer Motion + Lucide SVG hydration mismatches.
 */
function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-16 rounded-lg bg-muted/40" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-muted/40" />
        <div className="h-64 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}

/**
 * OpsBackground — CSS-only animated control-tower background.
 * Grid lines + radial gradient orbs + scan line.
 * Rendered server-side (no JS), no hydration issues.
 */
function OpsBackground() {
  return (
    <div className="ops-bg-wrapper" aria-hidden="true">
      {/* Perspective grid */}
      <div className="ops-grid" />
      {/* Dot accent grid */}
      <div className="ops-dot-grid" />
      {/* Radial gradient orbs */}
      <div className="ops-orb ops-orb-1" />
      <div className="ops-orb ops-orb-2" />
      <div className="ops-orb ops-orb-3" />
      {/* Animated scan line */}
      <div className="ops-scanline" />
      {/* Edge vignette */}
      <div className="ops-vignette" />
      {/* Corner accent brackets */}
      <div className="ops-corner-tl" />
      <div className="ops-corner-br" />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* ── Ops-themed animated background ── */}
      <OpsBackground />

      {/* ── Sidebar (glass morphism) ── */}
      <Sidebar />

      {/* ── Main content area ── */}
      <main className="ops-main flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ClientOnly fallback={<PageSkeleton />}>
            {children}
          </ClientOnly>
        </div>
      </main>
    </div>
  );
}
