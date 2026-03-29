"use client";

import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertSeverity } from "@/types";
import { getSeverityColor, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { slideInRight, springSmooth } from "@/lib/motion";

interface AlertCardProps {
  alert: Alert;
  siteName?: string;
  shiftName?: string;
  index?: number;
}

const SEVERITY_ICONS: Record<AlertSeverity, React.ElementType> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  resolved: CheckCircle2,
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
  resolved: "Resolved",
};

export function AlertCard({
  alert,
  siteName: siteNameProp,
  shiftName: shiftNameProp,
  index = 0,
}: AlertCardProps) {
  const siteName = siteNameProp ?? alert.siteName ?? alert.siteId;
  const shiftName = shiftNameProp ?? alert.shiftName ?? alert.shiftId;
  const Icon = SEVERITY_ICONS[alert.severity];
  const colorClass = getSeverityColor(alert.severity);
  const isNew = Date.now() - new Date(alert.timestamp).getTime() < 5 * 60 * 1000;
  const isCritical = alert.severity === "critical";
  const isWarning = alert.severity === "warning";

  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      whileHover={{
        scale: 1.005,
        x: 2,
        transition: springSmooth,
      }}
      className={cn(
        "relative flex gap-3 p-4 rounded-lg border bg-card transition-shadow duration-200 overflow-hidden",
        isCritical && "border-red-500/25 bg-red-500/[0.03]",
        isWarning && "border-amber-500/20",
        alert.severity === "info" && "border-blue-500/20",
        alert.severity === "resolved" && "border-emerald-500/20 opacity-70"
      )}
    >
      {/* Critical pulse glow overlay */}
      {isCritical && alert.status === "active" && (
        <motion.div
          className="absolute inset-0 rounded-lg border border-red-500/30 pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Left accent bar */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: index * 0.04 + 0.1, duration: 0.3, ease: "easeOut" }}
        className={cn(
          "absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full",
          isCritical && "bg-red-500",
          isWarning && "bg-amber-500",
          alert.severity === "info" && "bg-blue-500",
          alert.severity === "resolved" && "bg-emerald-500"
        )}
        style={{ originY: 0 }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.04 + 0.15, type: "spring", stiffness: 500, damping: 20 }}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
          isCritical && "bg-red-500/15",
          isWarning && "bg-amber-500/15",
          alert.severity === "info" && "bg-blue-500/15",
          alert.severity === "resolved" && "bg-emerald-500/15"
        )}
      >
        {/* Critical icon pulse */}
        {isCritical && alert.status === "active" && (
          <motion.div
            className="absolute w-8 h-8 rounded-full bg-red-500/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Icon
          className={cn(
            "w-4 h-4 relative z-10",
            isCritical && "text-red-500",
            isWarning && "text-amber-500",
            alert.severity === "info" && "text-blue-500",
            alert.severity === "resolved" && "text-emerald-500"
          )}
        />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-foreground leading-snug">
            {alert.message}
          </p>
          {isNew && alert.status === "active" && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="relative flex-shrink-0 mt-1.5"
            >
              <span className="flex h-2 w-2 rounded-full bg-red-500">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              </span>
            </motion.span>
          )}
        </div>

        {/* Meta row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.04 + 0.2, duration: 0.3 }}
          className="flex flex-wrap items-center gap-3 mt-2"
        >
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-5 font-medium", colorClass)}
          >
            {SEVERITY_LABELS[alert.severity]}
          </Badge>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Tag className="w-3 h-3" />
            <span>{alert.alertType}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{siteName}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{shiftName} Shift</span>
          </div>

          <span className="text-[11px] text-muted-foreground ml-auto">
            {timeAgo(alert.timestamp)}
          </span>
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 + 0.25, duration: 0.2 }}
          className="mt-2"
        >
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4",
              alert.status === "active" && "border-red-500/30 text-red-500",
              alert.status === "acknowledged" && "border-amber-500/30 text-amber-500",
              alert.status === "resolved" && "border-emerald-500/30 text-emerald-500"
            )}
          >
            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
          </Badge>
        </motion.div>
      </div>
    </motion.div>
  );
}
