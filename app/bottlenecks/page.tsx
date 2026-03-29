"use client";

import React, { useState } from "react";
import { AlertTriangle, TrendingDown, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { BottleneckCard } from "@/components/bottlenecks/BottleneckCard";
import { useMetrics } from "@/hooks/useMetrics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bottleneck, OpsMetric, ProcessMetric } from "@/types";
import { detectBottlenecks } from "@/lib/risk-engine";
import { SITES } from "@/lib/data-generator";
import {
  pageVariants,
  staggerContainer,
  fadeIn,
  springSmooth,
  cardVariants,
} from "@/lib/motion";

export default function BottlenecksPage() {
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data, isLoading, error, lastUpdated, refresh } = useMetrics({
    autoRefresh: true,
    refreshInterval: 15000,
  });

  const bottlenecks: Bottleneck[] = React.useMemo(() => {
    const processMetrics = (data?.processMetrics ?? []) as ProcessMetric[];
    const opsMetrics = (data?.opsMetrics ?? []) as OpsMetric[];
    if (processMetrics.length === 0) return [];

    const latestMap = new Map<string, ProcessMetric>();
    for (const pm of processMetrics) {
      const key = `${pm.siteId}-${pm.shiftId}-${pm.processStage}`;
      const existing = latestMap.get(key);
      if (!existing || new Date(pm.timestamp) > new Date(existing.timestamp)) {
        latestMap.set(key, pm);
      }
    }

    const latestOpsMap = new Map<string, OpsMetric>();
    for (const om of opsMetrics) {
      const key = `${om.siteId}-${om.shiftId}`;
      const existing = latestOpsMap.get(key);
      if (!existing || new Date(om.timestamp) > new Date(existing.timestamp)) {
        latestOpsMap.set(key, om);
      }
    }

    return detectBottlenecks(
      Array.from(latestMap.values()),
      Array.from(latestOpsMap.values())
    );
  }, [data]);

  const filteredBottlenecks = bottlenecks
    .filter((b) => {
      if (siteFilter !== "all" && b.siteId !== siteFilter) return false;
      if (stageFilter !== "all" && b.processStage !== stageFilter) return false;
      if (severityFilter !== "all" && b.severity !== severityFilter) return false;
      return true;
    })
    .sort((a, b) => b.stageRiskScore - a.stageRiskScore);

  const criticalCount = bottlenecks.filter((b) => b.severity === "Critical").length;
  const highCount = bottlenecks.filter((b) => b.severity === "High").length;
  const worstBottleneck = [...bottlenecks].sort((a, b) => b.stageRiskScore - a.stageRiskScore)[0];

  return (
    <AppShell>
      <TopBar
        title="Bottleneck Analysis"
        subtitle="Process stage performance, cycle time spikes, and throughput shortfalls"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
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
              <span>Failed to load bottleneck data.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Worst bottleneck highlight */}
        <AnimatePresence>
          {worstBottleneck && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 overflow-hidden relative"
            >
              {/* Animated background pulse */}
              <motion.div
                className="absolute inset-0 bg-red-500/5 rounded-lg"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatDelay: 4 }}
                  className="p-2 rounded-lg bg-red-500/10"
                >
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </motion.div>
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                    Worst Performing Stage
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {worstBottleneck.processStage} —{" "}
                    {SITES.find((s) => s.id === worstBottleneck.siteId)?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Risk Score: {worstBottleneck.stageRiskScore}/100 · {worstBottleneck.likelyCause}
                  </p>
                </div>
                {/* Risk score badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                  className="ml-auto flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center"
                >
                  <span className="text-xs font-bold text-red-500 tabular-nums">
                    {worstBottleneck.stageRiskScore}
                  </span>
                </motion.div>
              </div>
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
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {filteredBottlenecks.length} Bottlenecks Detected
            </span>
          </div>
          <AnimatePresence>
            {criticalCount > 0 && (
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
                <span className="text-xs font-medium text-red-500">{criticalCount} Critical</span>
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
                <span className="text-xs font-medium text-orange-500">{highCount} High</span>
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

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Inbound">Inbound</SelectItem>
              <SelectItem value="Picking">Picking</SelectItem>
              <SelectItem value="Packing">Packing</SelectItem>
              <SelectItem value="Dispatch">Dispatch</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Bottleneck cards */}
        {isLoading && !data ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="h-56 rounded-lg bg-muted/30 shimmer"
              />
            ))}
          </motion.div>
        ) : filteredBottlenecks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSmooth}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Layers className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No bottlenecks detected</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              All process stages are operating within normal parameters
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredBottlenecks.map((bottleneck, i) => (
                <BottleneckCard
                  key={bottleneck.id}
                  bottleneck={bottleneck}
                  rank={i + 1}
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
