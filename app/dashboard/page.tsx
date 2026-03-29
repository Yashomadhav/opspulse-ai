"use client";

import React, { useState, useCallback } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Users,
  UserMinus,
  UserX,
  Activity,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { KPICard } from "@/components/dashboard/KPICard";
import { ThroughputChart } from "@/components/dashboard/ThroughputChart";
import { BacklogChart } from "@/components/dashboard/BacklogChart";
import { SLAChart } from "@/components/dashboard/SLAChart";
import { StaffingChart } from "@/components/dashboard/StaffingChart";
import { SiteComparisonChart } from "@/components/dashboard/SiteComparisonChart";
import { ProcessStageChart } from "@/components/dashboard/ProcessStageChart";
import { useMetrics } from "@/hooks/useMetrics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  pageVariants,
  staggerContainer,
  staggerContainerSlow,
  cardVariants,
  chartEntranceVariants,
  fadeIn,
} from "@/lib/motion";

export default function DashboardPage() {
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const { data, isLoading, error, lastUpdated, refresh } = useMetrics({
    siteId: siteFilter !== "all" ? siteFilter : undefined,
    autoRefresh: true,
    refreshInterval: 15000,
  });

  const kpis = data?.kpis;

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <AppShell>
      <TopBar
        title="Executive Dashboard"
        subtitle="Real-time operations overview across all sites and shifts"
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
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
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to load metrics. Showing cached data.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3"
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
        </motion.div>

        {/* KPI Cards — Row 1: Orders & Throughput */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            variants={fadeIn}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
          >
            Order & Throughput KPIs
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard
              title="Incoming Orders"
              value={kpis?.totalIncomingOrders ?? 0}
              icon={Package}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
              format="number"
              description="Total orders received this period"
              isLoading={isLoading && !data}
              index={0}
            />
            <KPICard
              title="Processed Orders"
              value={kpis?.totalProcessedOrders ?? 0}
              icon={CheckCircle2}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10"
              format="number"
              description="Successfully fulfilled orders"
              isLoading={isLoading && !data}
              index={1}
            />
            <KPICard
              title="Backlog"
              value={kpis?.totalBacklog ?? 0}
              icon={AlertTriangle}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
              format="number"
              trendInverted
              description="Orders pending processing"
              highlight={
                (kpis?.totalBacklog ?? 0) > 800
                  ? "critical"
                  : (kpis?.totalBacklog ?? 0) > 400
                  ? "warning"
                  : "neutral"
              }
              isLoading={isLoading && !data}
              index={2}
            />
            <KPICard
              title="Throughput / Hour"
              value={kpis?.avgThroughputPerHour ?? 0}
              unit="/hr"
              icon={TrendingUp}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-500/10"
              format="number"
              decimals={0}
              description="Average orders processed per hour"
              isLoading={isLoading && !data}
              index={3}
            />
            <KPICard
              title="SLA Attainment"
              value={kpis?.avgSlaAttainment ?? 0}
              icon={Target}
              iconColor="text-purple-500"
              iconBg="bg-purple-500/10"
              format="percent"
              decimals={1}
              description="% of orders meeting SLA target"
              highlight={
                (kpis?.avgSlaAttainment ?? 100) < 85
                  ? "critical"
                  : (kpis?.avgSlaAttainment ?? 100) < 95
                  ? "warning"
                  : "success"
              }
              isLoading={isLoading && !data}
              index={4}
            />
          </div>
        </motion.div>

        {/* KPI Cards — Row 2: Staffing & Risk */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            variants={fadeIn}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
          >
            Staffing & Risk KPIs
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard
              title="Active Staff"
              value={kpis?.totalActiveStaff ?? 0}
              icon={Users}
              iconColor="text-teal-500"
              iconBg="bg-teal-500/10"
              format="number"
              description="Currently on-shift headcount"
              isLoading={isLoading && !data}
              index={0}
            />
            <KPICard
              title="Required Staff"
              value={kpis?.totalRequiredStaff ?? 0}
              icon={UserMinus}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
              format="number"
              description="Headcount needed to meet targets"
              isLoading={isLoading && !data}
              index={1}
            />
            <KPICard
              title="Staffing Gap"
              value={kpis?.totalStaffingGap ?? 0}
              icon={UserX}
              iconColor="text-red-500"
              iconBg="bg-red-500/10"
              format="number"
              trendInverted
              description="Shortfall vs required headcount"
              highlight={
                (kpis?.totalStaffingGap ?? 0) > 10
                  ? "critical"
                  : (kpis?.totalStaffingGap ?? 0) > 5
                  ? "warning"
                  : "neutral"
              }
              isLoading={isLoading && !data}
              index={2}
            />
            <KPICard
              title="Absenteeism"
              value={kpis?.avgAbsenteeismRate ?? 0}
              icon={UserX}
              iconColor="text-orange-500"
              iconBg="bg-orange-500/10"
              format="percent"
              decimals={1}
              trendInverted
              description="% of scheduled staff absent"
              highlight={
                (kpis?.avgAbsenteeismRate ?? 0) > 15
                  ? "critical"
                  : (kpis?.avgAbsenteeismRate ?? 0) > 8
                  ? "warning"
                  : "neutral"
              }
              isLoading={isLoading && !data}
              index={3}
            />
            <KPICard
              title="Delay Risk Score"
              value={kpis?.overallRiskScore ?? 0}
              icon={Activity}
              iconColor="text-red-500"
              iconBg="bg-red-500/10"
              format="number"
              trendInverted
              description="Composite operational risk (0–100)"
              highlight={
                (kpis?.overallRiskScore ?? 0) >= 75
                  ? "critical"
                  : (kpis?.overallRiskScore ?? 0) >= 50
                  ? "warning"
                  : (kpis?.overallRiskScore ?? 0) >= 25
                  ? "warning"
                  : "success"
              }
              isLoading={isLoading && !data}
              index={4}
            />
          </div>
        </motion.div>

        {/* Charts — Row 1 */}
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <motion.div variants={chartEntranceVariants}>
            <ThroughputChart
              data={data?.throughputTrend ?? []}
              isLoading={isLoading && !data}
            />
          </motion.div>
          <motion.div variants={chartEntranceVariants}>
            <BacklogChart
              data={data?.backlogTrend ?? []}
              threshold={500}
              isLoading={isLoading && !data}
            />
          </motion.div>
        </motion.div>

        {/* Charts — Row 2 */}
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <motion.div variants={chartEntranceVariants}>
            <SLAChart
              data={data?.slaTrend ?? []}
              target={95}
              isLoading={isLoading && !data}
            />
          </motion.div>
          <motion.div variants={chartEntranceVariants}>
            <StaffingChart
              data={data?.staffingTrend ?? []}
              isLoading={isLoading && !data}
            />
          </motion.div>
        </motion.div>

        {/* Charts — Row 3: Site & Stage comparison */}
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <motion.div variants={chartEntranceVariants}>
            <SiteComparisonChart
              data={data?.siteComparison ?? []}
              isLoading={isLoading && !data}
            />
          </motion.div>
          <motion.div variants={chartEntranceVariants}>
            <ProcessStageChart
              data={data?.stageComparison ?? []}
              isLoading={isLoading && !data}
            />
          </motion.div>
        </motion.div>

        {/* Footer note */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground border-t border-border"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-3 h-3 text-indigo-500" />
          </motion.div>
          <span>
            OpsPulse AI · Data refreshes every 15 seconds · All times in local timezone
          </span>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
