"use client";

import React from "react";
import {
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ShiftSummary } from "@/types";
import {
  getRiskBgColor,
  getRiskScoreBarColor,
  formatNumber,
  formatPercent,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { cardVariants, springSmooth } from "@/lib/motion";

interface ShiftCardProps {
  summary: ShiftSummary;
  index?: number;
}

export function ShiftCard({ summary, index = 0 }: ShiftCardProps) {
  const { shift, site, metrics, riskLevel } = summary;
  const riskBg = getRiskBgColor(riskLevel);
  const riskBarColor = getRiskScoreBarColor(metrics.riskScore);

  const staffingGapPct =
    metrics.requiredStaff > 0
      ? ((metrics.staffingGap / metrics.requiredStaff) * 100).toFixed(0)
      : "0";

  const riskColor =
    metrics.riskScore >= 75
      ? { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-500", ring: "ring-red-500/30" }
      : metrics.riskScore >= 50
      ? { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-500", ring: "ring-orange-500/30" }
      : metrics.riskScore >= 25
      ? { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-500", ring: "ring-amber-500/30" }
      : { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/30" };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.015,
        y: -3,
        transition: springSmooth,
      }}
      whileTap={{ scale: 0.99 }}
      custom={index}
    >
      <Card
        className={cn(
          "border transition-shadow duration-300 hover:shadow-lg",
          riskLevel === "Critical" && "border-red-500/20 bg-red-500/[0.02]",
          riskLevel === "High" && "border-orange-500/20",
          riskLevel === "Medium" && "border-amber-500/20"
        )}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-foreground">
                  {shift.name} Shift
                </h3>
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.2, type: "spring", stiffness: 500 }}
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    riskBg
                  )}
                >
                  {riskLevel} Risk
                </motion.span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{site.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {shift.startTime} – {shift.endTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Animated risk score circle */}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center border-2",
                  riskColor.border,
                  riskColor.bg
                )}
              >
                {/* Pulse ring for high risk */}
                {metrics.riskScore >= 75 && (
                  <motion.div
                    className={cn("absolute inset-0 rounded-full border-2", riskColor.border)}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <motion.span
                  key={metrics.riskScore}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className={cn("text-sm font-bold tabular-nums", riskColor.text)}
                >
                  {metrics.riskScore}
                </motion.span>
              </div>
              <span className="text-[9px] text-muted-foreground mt-1">Risk</span>
            </motion.div>
          </div>

          {/* Animated risk score bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Risk Score</span>
              <span>{metrics.riskScore}/100</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", riskBarColor)}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.riskScore}%` }}
                transition={{ delay: index * 0.05 + 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { icon: Package, color: "text-blue-500", label: "Incoming", value: formatNumber(metrics.incomingOrders) },
              { icon: Activity, color: "text-emerald-500", label: "Processed", value: formatNumber(metrics.processedOrders) },
              { icon: AlertTriangle, color: "text-amber-500", label: "Backlog", value: formatNumber(metrics.backlog) },
              { icon: TrendingUp, color: "text-indigo-500", label: "Throughput", value: `${formatNumber(metrics.throughputPerHour)}/hr` },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.2 + i * 0.05, duration: 0.3 }}
                className="p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className={cn("w-3 h-3", item.color)} />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-sm font-bold text-foreground tabular-nums">{item.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Staffing row */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 + 0.4, duration: 0.3 }}
            className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 mb-3"
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs text-muted-foreground">Staffing</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-foreground font-semibold tabular-nums">
                {metrics.activeStaff}
                <span className="text-muted-foreground font-normal">
                  /{metrics.requiredStaff}
                </span>
              </span>
              {metrics.staffingGap > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.5, type: "spring" }}
                  className="text-red-500 font-semibold"
                >
                  -{metrics.staffingGap} gap
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Bottom stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.45, duration: 0.3 }}
            className="grid grid-cols-3 gap-2 pt-3 border-t border-border"
          >
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">SLA</p>
              <motion.p
                key={metrics.slaAttainment}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-xs font-bold tabular-nums",
                  metrics.slaAttainment >= 95
                    ? "text-emerald-500"
                    : metrics.slaAttainment >= 85
                    ? "text-amber-500"
                    : "text-red-500"
                )}
              >
                {formatPercent(metrics.slaAttainment, 1)}
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Absent</p>
              <motion.p
                key={metrics.absenteeismRate}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-xs font-bold tabular-nums",
                  metrics.absenteeismRate > 15
                    ? "text-red-500"
                    : metrics.absenteeismRate > 8
                    ? "text-amber-500"
                    : "text-emerald-500"
                )}
              >
                {formatPercent(metrics.absenteeismRate, 1)}
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Pred. Backlog</p>
              <p className="text-xs font-bold text-foreground tabular-nums">
                {formatNumber(metrics.predictedEndShiftBacklog)}
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
