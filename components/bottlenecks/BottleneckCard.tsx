"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Users,
  Zap,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Bottleneck } from "@/types";
import { getRiskBgColor, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { STAGE_COLORS } from "@/lib/utils";
import { SITES, SHIFTS } from "@/lib/data-generator";
import { cardVariants, springSmooth } from "@/lib/motion";

interface BottleneckCardProps {
  bottleneck: Bottleneck;
  siteName?: string;
  shiftName?: string;
  rank?: number;
  index?: number;
}

export function BottleneckCard({
  bottleneck,
  siteName: siteNameProp,
  shiftName: shiftNameProp,
  rank,
  index = 0,
}: BottleneckCardProps) {
  const siteName =
    siteNameProp ??
    SITES.find((s) => s.id === bottleneck.siteId)?.name ??
    bottleneck.siteId;
  const shiftName =
    shiftNameProp ??
    SHIFTS.find((s) => s.id === bottleneck.shiftId)?.name ??
    bottleneck.shiftId;
  const stageColor = STAGE_COLORS[bottleneck.processStage] ?? "#6366F1";
  const riskBg = getRiskBgColor(bottleneck.severity);
  const isCritical = bottleneck.severity === "Critical";
  const isHigh = bottleneck.severity === "High";

  const metrics = [
    {
      icon: Clock,
      color: "text-amber-500",
      label: "Cycle Time Spike",
      value: `+${bottleneck.cycleTimeSpike.toFixed(0)}%`,
    },
    {
      icon: TrendingDown,
      color: "text-red-500",
      label: "Throughput Gap",
      value: `-${bottleneck.throughputShortfall.toFixed(0)}%`,
    },
    {
      icon: Zap,
      color: "text-orange-500",
      label: "Backlog Build-up",
      value: `${formatNumber(bottleneck.backlogBuildUp)} units`,
    },
    {
      icon: Users,
      color: "text-indigo-500",
      label: "Staff Shortage",
      value: bottleneck.staffingShortage > 0 ? `-${bottleneck.staffingShortage} FTE` : "Adequate",
    },
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.015, y: -3, transition: springSmooth }}
      whileTap={{ scale: 0.99 }}
      custom={index}
    >
      <Card
        className={cn(
          "border transition-shadow duration-300 hover:shadow-lg overflow-hidden",
          isCritical && "border-red-500/20 bg-red-500/[0.02]",
          isHigh && "border-orange-500/20"
        )}
      >
        <CardContent className="p-4">
          {/* Stage color top bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.06 + 0.1, duration: 0.5, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
            style={{ backgroundColor: stageColor, originX: 0 }}
          />

          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            {rank && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.06 + 0.15, type: "spring", stiffness: 500 }}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-muted-foreground">#{rank}</span>
              </motion.div>
            )}

            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.06 + 0.2, duration: 0.3 }}
              className="flex-shrink-0 w-2 self-stretch rounded-full"
              style={{ backgroundColor: stageColor, originY: 0 }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div>
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 + 0.2, duration: 0.3 }}
                    className="text-sm font-bold"
                    style={{ color: stageColor }}
                  >
                    {bottleneck.processStage}
                  </motion.span>
                  <span className="text-xs text-muted-foreground ml-2">Stage</span>
                </div>
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.06 + 0.25, type: "spring", stiffness: 500 }}
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border",
                    riskBg
                  )}
                >
                  {bottleneck.severity} Risk
                </motion.span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{siteName}</span>
                <span>·</span>
                <span>{shiftName} Shift</span>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 + 0.25 + i * 0.05, duration: 0.3 }}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <m.icon className={cn("w-3.5 h-3.5 flex-shrink-0", m.color)} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{m.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Cause & Impact */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 + 0.45, duration: 0.3 }}
            className="space-y-2 mb-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Likely Cause
                </span>
                <p className="text-xs text-foreground mt-0.5">{bottleneck.likelyCause}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  SLA Impact
                </span>
                <p className="text-xs text-foreground mt-0.5">{bottleneck.slaImpact}</p>
              </div>
            </div>
          </motion.div>

          {/* Suggested action */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 + 0.5, duration: 0.3 }}
            whileHover={{ x: 3, transition: springSmooth }}
            className="flex items-start gap-2 p-2.5 rounded-md bg-indigo-500/5 border border-indigo-500/10 cursor-default"
          >
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            </motion.div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              <span className="font-semibold">Action: </span>
              {bottleneck.suggestedAction}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
