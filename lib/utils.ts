import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskLevel, AlertSeverity, RecommendationPriority } from "@/types";

// ─── Tailwind Class Merger ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Number Formatters ────────────────────────────────────────

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDatetime(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ─── Risk / Severity Helpers ──────────────────────────────────

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

export function getRiskColor(level: RiskLevel | string): string {
  switch (level) {
    case "Critical":
      return "text-red-500";
    case "High":
      return "text-orange-500";
    case "Medium":
      return "text-amber-500";
    case "Low":
      return "text-emerald-500";
    default:
      return "text-slate-500";
  }
}

export function getRiskBgColor(level: RiskLevel | string): string {
  switch (level) {
    case "Critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "High":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "Medium":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Low":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
}

export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "warning":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "info":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "resolved":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
}

export function getPriorityColor(priority: RecommendationPriority): string {
  switch (priority) {
    case "urgent":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "low":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
}

export function getRiskScoreColor(score: number): string {
  if (score >= 75) return "text-red-500";
  if (score >= 50) return "text-orange-500";
  if (score >= 25) return "text-amber-500";
  return "text-emerald-500";
}

export function getRiskScoreBarColor(score: number): string {
  if (score >= 75) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 25) return "bg-amber-500";
  return "bg-emerald-500";
}

// ─── SLA Helpers ──────────────────────────────────────────────

export function getSLAStatus(attainment: number): {
  label: string;
  color: string;
} {
  if (attainment >= 95) return { label: "On Track", color: "text-emerald-500" };
  if (attainment >= 85) return { label: "At Risk", color: "text-amber-500" };
  if (attainment >= 70) return { label: "Breaching", color: "text-orange-500" };
  return { label: "Critical", color: "text-red-500" };
}

// ─── Trend Helpers ────────────────────────────────────────────

export function getTrendDirection(
  current: number,
  previous: number
): "up" | "down" | "flat" {
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return "flat";
  return diff > 0 ? "up" : "down";
}

export function getTrendPercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// ─── Clamp ────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Random Helpers ───────────────────────────────────────────

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

export function jitter(value: number, pct: number): number {
  const delta = value * pct;
  return value + randomBetween(-delta, delta);
}

// ─── ID Generator ─────────────────────────────────────────────

export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Stage Color Map ──────────────────────────────────────────

export const STAGE_COLORS: Record<string, string> = {
  Inbound: "#6366F1",
  Picking: "#0EA5E9",
  Packing: "#10B981",
  Dispatch: "#F59E0B",
};

export const SITE_COLORS: Record<string, string> = {
  "site-1": "#6366F1",
  "site-2": "#0EA5E9",
};
