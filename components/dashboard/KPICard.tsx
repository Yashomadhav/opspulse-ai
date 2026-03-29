"use client";

import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber, formatPercent, getTrendPercent } from "@/lib/utils";
import { cardVariants, springSmooth, easeOutExpo } from "@/lib/motion";

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  previousValue?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  format?: "number" | "percent" | "raw";
  decimals?: number;
  trendInverted?: boolean;
  description?: string;
  highlight?: "success" | "warning" | "critical" | "neutral";
  isLoading?: boolean;
  index?: number; // for stagger delay
}

/** Animated number counter hook */
function useAnimatedNumber(target: number, decimals: number = 0) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (from === to) return;

    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target]);

  return display;
}

export function KPICard({
  title,
  value,
  unit,
  previousValue,
  icon: Icon,
  iconColor = "text-indigo-500",
  iconBg = "bg-indigo-500/10",
  format = "number",
  decimals = 0,
  trendInverted = false,
  description,
  highlight,
  isLoading = false,
  index = 0,
}: KPICardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value));
  const animatedValue = useAnimatedNumber(isLoading ? 0 : numericValue, decimals);

  const trendPct =
    previousValue !== undefined && previousValue !== 0
      ? getTrendPercent(numericValue, previousValue)
      : null;

  const trendDirection =
    trendPct === null ? null : trendPct > 0.5 ? "up" : trendPct < -0.5 ? "down" : "flat";

  const trendPositive =
    trendDirection === null
      ? null
      : trendInverted
      ? trendDirection === "down"
      : trendDirection === "up";

  const formattedValue =
    typeof value === "string"
      ? value
      : format === "percent"
      ? formatPercent(animatedValue, decimals)
      : format === "number"
      ? formatNumber(animatedValue, decimals)
      : String(value);

  const highlightBorder = {
    success: "border-emerald-500/30",
    warning: "border-amber-500/30",
    critical: "border-red-500/30",
    neutral: "border-border",
  }[highlight ?? "neutral"];

  const highlightGlow = {
    success: "",
    warning: "",
    critical: highlight === "critical" ? "glow-red" : "",
    neutral: "",
  }[highlight ?? "neutral"];

  if (isLoading) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
      >
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-muted rounded shimmer" />
                <div className="h-8 w-8 bg-muted rounded-lg shimmer" />
              </div>
              <div className="h-8 w-20 bg-muted rounded shimmer" />
              <div className="h-3 w-32 bg-muted rounded shimmer" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.02,
        y: -3,
        transition: springSmooth,
      }}
      whileTap={{ scale: 0.99, transition: springSmooth }}
      className={cn("cursor-default", highlightGlow)}
    >
      <Card
        className={cn(
          "border transition-shadow duration-300 hover:shadow-lg",
          highlightBorder,
          highlight === "critical" && "bg-red-500/[0.03]",
          highlight === "warning" && "bg-amber-500/[0.02]",
          highlight === "success" && "bg-emerald-500/[0.02]"
        )}
      >
        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
              {title}
            </p>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={springSmooth}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                iconBg
              )}
            >
              <Icon className={cn("w-4 h-4", iconColor)} />
            </motion.div>
          </div>

          {/* Animated Value */}
          <div className="flex items-end gap-1.5 mb-2">
            <motion.span
              key={numericValue}
              initial={{ opacity: 0.6, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold text-foreground leading-none tabular-nums"
            >
              {formattedValue}
            </motion.span>
            {unit && (
              <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>
            )}
          </div>

          {/* Trend */}
          {trendDirection !== null && trendPct !== null ? (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center gap-1"
            >
              <motion.div
                animate={
                  trendDirection !== "flat"
                    ? { y: trendDirection === "up" ? [0, -2, 0] : [0, 2, 0] }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {trendDirection === "up" ? (
                  <TrendingUp
                    className={cn(
                      "w-3.5 h-3.5",
                      trendPositive ? "text-emerald-500" : "text-red-500"
                    )}
                  />
                ) : trendDirection === "down" ? (
                  <TrendingDown
                    className={cn(
                      "w-3.5 h-3.5",
                      trendPositive ? "text-emerald-500" : "text-red-500"
                    )}
                  />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </motion.div>
              <span
                className={cn(
                  "text-xs font-medium",
                  trendDirection === "flat"
                    ? "text-muted-foreground"
                    : trendPositive
                    ? "text-emerald-500"
                    : "text-red-500"
                )}
              >
                {trendDirection !== "flat"
                  ? `${Math.abs(trendPct).toFixed(1)}%`
                  : "No change"}
              </span>
              <span className="text-xs text-muted-foreground">vs prev</span>
            </motion.div>
          ) : description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}

          {/* Critical pulse border overlay */}
          {highlight === "critical" && (
            <motion.div
              className="absolute inset-0 rounded-lg border border-red-500/40 pointer-events-none"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
