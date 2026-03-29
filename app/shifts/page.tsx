"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { useMetrics } from "@/hooks/useMetrics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SITES, SHIFTS } from "@/lib/data-generator";
import { ShiftSummary, OpsMetric } from "@/types";
import { getRiskLevel } from "@/lib/utils";
import {
  pageVariants,
  staggerContainer,
  fadeIn,
  springSmooth,
} from "@/lib/motion";

export default function ShiftsPage() {
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const { data, isLoading, error, lastUpdated, refresh } = useMetrics({
    siteId: siteFilter !== "all" ? siteFilter : undefined,
    autoRefresh: true,
    refreshInterval: 15000,
  });

  const shiftSummaries: ShiftSummary[] = React.useMemo(() => {
    const metrics = (data?.opsMetrics ?? []) as OpsMetric[];
    if (metrics.length === 0) return [];

    return SHIFTS.flatMap((shift) => {
      const site = SITES.find((s) => s.id === shift.siteId);
      if (!site) return [];

      const shiftMetrics = metrics
        .filter((m) => m.shiftId === shift.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const latestMetric = shiftMetrics[0];
      if (!latestMetric) return [];

      const riskLevel = getRiskLevel(latestMetric.riskScore);

      return [{
        shift,
        site,
        metrics: latestMetric,
        riskLevel,
        statusBadge: `${riskLevel} Risk`,
      }] as ShiftSummary[];
    });
  }, [data]);

  const filteredSummaries = shiftSummaries
    .filter((s) => {
      if (siteFilter !== "all" && s.site.id !== siteFilter) return false;
      if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
      return true;
    })
    .sort((a, b) => b.metrics.riskScore - a.metrics.riskScore);

  const criticalCount = shiftSummaries.filter((s) => s.riskLevel === "Critical").length;
  const highCount = shiftSummaries.filter((s) => s.riskLevel === "High").length;

  return (
    <AppShell>
      <TopBar
        title="Shift Monitor"
        subtitle="Live performance tracking across all active shifts and sites"
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
              <span>Failed to load shift data. Showing cached data.</span>
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
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {filteredSummaries.length} Active Shifts
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
                <span className="text-xs font-medium text-red-500">
                  {criticalCount} Critical
                </span>
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
                <span className="text-xs font-medium text-orange-500">
                  {highCount} High Risk
                </span>
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

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Shift cards grid */}
        {isLoading && !data ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="h-64 rounded-lg bg-muted/30 shimmer"
              />
            ))}
          </motion.div>
        ) : filteredSummaries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSmooth}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No shifts match your filters</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting the site or risk level filter</p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredSummaries.map((summary, i) => (
                <ShiftCard
                  key={`${summary.site.id}-${summary.shift.id}`}
                  summary={summary}
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
