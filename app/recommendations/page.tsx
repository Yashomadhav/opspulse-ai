"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Recommendation } from "@/types";
import {
  pageVariants,
  staggerContainer,
  fadeIn,
  springSmooth,
} from "@/lib/motion";

export default function RecommendationsPage() {
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const params = new URLSearchParams();
      if (siteFilter !== "all") params.set("siteId", siteFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      params.set("limit", "50");

      const response = await fetch(`/api/recommendations?${params.toString()}`, {
        signal: abortRef.current.signal,
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (json.success) {
        setRecommendations((json.data?.recommendations as Recommendation[]) ?? []);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error ?? "Unknown error");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch recommendations");
    } finally {
      setIsLoading(false);
    }
  }, [siteFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchRecommendations();
    intervalRef.current = setInterval(fetchRecommendations, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchRecommendations]);

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  const urgentCount = recommendations.filter((r) => r.priority === "urgent").length;
  const highCount = recommendations.filter((r) => r.priority === "high").length;

  return (
    <AppShell>
      <TopBar
        title="Recommendations Engine"
        subtitle="AI-generated operational actions to improve throughput, staffing, and SLA"
        lastUpdated={lastUpdated}
        onRefresh={fetchRecommendations}
        isRefreshing={isLoading}
      />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-6"
      >
        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to load recommendations.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary bar */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-card border border-border"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </motion.div>
            <span className="text-sm font-medium text-foreground">
              {recommendations.length} Recommendations
            </span>
          </div>
          <AnimatePresence>
            {urgentCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20"
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-red-500"
                />
                <span className="text-xs font-medium text-red-500">{urgentCount} Urgent</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {highCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.05 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-xs font-medium text-orange-500">{highCount} High Priority</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center gap-3"
        >
          <span className="text-xs text-muted-foreground font-medium">Filter by:</span>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="site-1">Site 1 — Northgate</SelectItem>
              <SelectItem value="site-2">Site 2 — Southpark</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="staffing">Staffing</SelectItem>
              <SelectItem value="throughput">Throughput</SelectItem>
              <SelectItem value="escalation">Escalation</SelectItem>
              <SelectItem value="process">Process</SelectItem>
              <SelectItem value="sla">SLA</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Recommendations list */}
        {isLoading && recommendations.length === 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="h-32 rounded-lg bg-muted/30 shimmer"
              />
            ))}
          </motion.div>
        ) : sortedRecommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSmooth}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-muted-foreground">No recommendations at this time</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Operations are running within acceptable parameters
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {sortedRecommendations.map((rec, i) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
