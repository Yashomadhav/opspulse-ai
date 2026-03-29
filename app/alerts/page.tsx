"use client";

import React, { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useAlerts } from "@/hooks/useAlerts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/types";
import {
  pageVariants,
  staggerContainerFast,
  fadeIn,
  springSmooth,
} from "@/lib/motion";

export default function AlertsPage() {
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { alerts, isLoading, error, lastUpdated, refresh } = useAlerts({
    siteId: siteFilter !== "all" ? siteFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    autoRefresh: true,
    refreshInterval: 15000,
  });

  const filteredAlerts = alerts
    .filter((a: Alert) => {
      if (siteFilter !== "all" && a.siteId !== siteFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    })
    .sort((a: Alert, b: Alert) => {
      const severityOrder = { critical: 0, warning: 1, info: 2, resolved: 3 };
      const aSev = severityOrder[a.severity] ?? 4;
      const bSev = severityOrder[b.severity] ?? 4;
      if (aSev !== bSev) return aSev - bSev;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const criticalCount = alerts.filter((a: Alert) => a.severity === "critical").length;
  const warningCount = alerts.filter((a: Alert) => a.severity === "warning").length;
  const activeCount = alerts.filter((a: Alert) => a.status === "active").length;

  return (
    <AppShell>
      <TopBar
        title="Alerts Feed"
        subtitle="Live operational alerts across all sites and shifts"
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
              <span>Failed to load alerts. Showing cached data.</span>
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
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
            </motion.div>
            <span className="text-sm font-medium text-foreground">
              {filteredAlerts.length} Alerts
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
            {warningCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.05 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-amber-500">
                  {warningCount} Warnings
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-500">
                  {activeCount} Active
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

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Alerts list */}
        {isLoading && alerts.length === 0 ? (
          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="h-24 rounded-lg bg-muted/30 shimmer"
              />
            ))}
          </motion.div>
        ) : filteredAlerts.length === 0 ? (
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
            <p className="text-sm font-medium text-muted-foreground">No alerts match your filters</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              All systems operating normally
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert: Alert, i: number) => (
                <AlertCard key={alert.id} alert={alert} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
