"use client";

import React from "react";
import {
  Users,
  TrendingUp,
  AlertOctagon,
  Settings,
  Target,
  ArrowRight,
  Building2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Recommendation, RecommendationCategory, RecommendationPriority } from "@/types";
import { getPriorityColor, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { cardVariants, springSmooth } from "@/lib/motion";

interface RecommendationCardProps {
  recommendation: Recommendation;
  siteName?: string;
  shiftName?: string;
  index?: number;
}

const CATEGORY_ICONS: Record<RecommendationCategory, React.ElementType> = {
  staffing: Users,
  throughput: TrendingUp,
  escalation: AlertOctagon,
  process: Settings,
  sla: Target,
};

const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  staffing: "Staffing",
  throughput: "Throughput",
  escalation: "Escalation",
  process: "Process",
  sla: "SLA",
};

const CATEGORY_COLORS: Record<RecommendationCategory, string> = {
  staffing: "bg-indigo-500/10 text-indigo-500",
  throughput: "bg-blue-500/10 text-blue-500",
  escalation: "bg-red-500/10 text-red-500",
  process: "bg-purple-500/10 text-purple-500",
  sla: "bg-emerald-500/10 text-emerald-500",
};

const CATEGORY_BORDER_COLORS: Record<RecommendationCategory, string> = {
  staffing: "border-indigo-500/20",
  throughput: "border-blue-500/20",
  escalation: "border-red-500/20",
  process: "border-purple-500/20",
  sla: "border-emerald-500/20",
};

const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function RecommendationCard({
  recommendation,
  siteName: siteNameProp,
  shiftName: shiftNameProp,
  index = 0,
}: RecommendationCardProps) {
  const siteName = siteNameProp ?? recommendation.siteName ?? recommendation.siteId;
  const shiftName = shiftNameProp ?? recommendation.shiftName ?? recommendation.shiftId;
  const Icon = CATEGORY_ICONS[recommendation.category];
  const priorityColor = getPriorityColor(recommendation.priority);
  const categoryColor = CATEGORY_COLORS[recommendation.category];
  const categoryBorder = CATEGORY_BORDER_COLORS[recommendation.category];
  const isUrgent = recommendation.priority === "urgent";
  const isHigh = recommendation.priority === "high";

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.012, y: -2, transition: springSmooth }}
      whileTap={{ scale: 0.99 }}
      custom={index}
    >
      <Card
        className={cn(
          "border transition-shadow duration-300 hover:shadow-lg overflow-hidden",
          isUrgent && "border-red-500/20 bg-red-500/[0.02]",
          isHigh && "border-orange-500/20"
        )}
      >
        {/* Priority top accent bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.05 + 0.1, duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-0.5 w-full",
            isUrgent && "bg-red-500",
            isHigh && "bg-orange-500",
            !isUrgent && !isHigh && "bg-indigo-500/40"
          )}
          style={{ originX: 0 }}
        />

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 400, damping: 20 }}
              whileHover={{ rotate: 10, scale: 1.1, transition: springSmooth }}
              className={cn(
                "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                categoryColor
              )}
            >
              <Icon className="w-4 h-4" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                className="flex items-center gap-2 flex-wrap mb-1"
              >
                <Badge className={cn("text-[10px] px-1.5 py-0 h-5", categoryColor)}>
                  {CATEGORY_LABELS[recommendation.category]}
                </Badge>
                <Badge className={cn("text-[10px] px-1.5 py-0 h-5", priorityColor)}>
                  {PRIORITY_LABELS[recommendation.priority]}
                </Badge>
                {isUrgent && (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[10px] font-bold text-red-500"
                  >
                    ● URGENT
                  </motion.span>
                )}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.25, duration: 0.3 }}
                className="text-sm font-semibold text-foreground leading-snug"
              >
                {recommendation.message}
              </motion.p>
            </div>
          </div>

          {/* Business reason */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.3, duration: 0.3 }}
            className="mb-3 pl-12"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Why: </span>
              {recommendation.businessReason}
            </p>
          </motion.div>

          {/* Expected impact */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 + 0.35, duration: 0.3 }}
            whileHover={{ x: 3, transition: springSmooth }}
            className="flex items-start gap-2 mb-3 pl-12 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10 cursor-default"
          >
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            </motion.div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
              <span className="font-medium">Expected impact: </span>
              {recommendation.expectedImpact}
            </p>
          </motion.div>

          {/* Footer meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.4, duration: 0.3 }}
            className="flex flex-wrap items-center gap-3 pt-2 border-t border-border"
          >
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>{siteName}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{shiftName} Shift</span>
            </div>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {timeAgo(recommendation.timestamp)}
            </span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
