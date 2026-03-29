"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Target,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulatorResults as SimResults } from "@/types";
import {
  getRiskBgColor,
  getRiskLevel,
  getRiskScoreBarColor,
  formatNumber,
  formatPercent,
  cn,
} from "@/lib/utils";

interface SimulatorResultsProps {
  results: SimResults;
}

export function SimulatorResultsPanel({ results }: SimulatorResultsProps) {
  const riskLevel = getRiskLevel(results.projectedRiskScore);
  const riskBg = getRiskBgColor(riskLevel);
  const riskBarColor = getRiskScoreBarColor(results.projectedRiskScore);

  const backlogChartData = results.backlogTrend.map((d) => ({
    time: d.label,
    Backlog: d.value,
  }));

  const slaChartData = results.slaTrend.map((d) => ({
    time: d.label,
    SLA: d.value,
  }));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary banner */}
      <div
        className={cn(
          "p-4 rounded-lg border",
          results.projectedRiskScore >= 75
            ? "bg-red-500/5 border-red-500/20"
            : results.projectedRiskScore >= 50
            ? "bg-orange-500/5 border-orange-500/20"
            : results.projectedRiskScore >= 25
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-emerald-500/5 border-emerald-500/20"
        )}
      >
        <p className="text-sm font-medium text-foreground">{results.summary}</p>
      </div>

      {/* KPI result cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Projected Backlog */}
        <Card className="border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Proj. Backlog
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatNumber(results.projectedBacklog)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">units</p>
          </CardContent>
        </Card>

        {/* Projected SLA */}
        <Card className="border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Proj. SLA
              </span>
            </div>
            <p
              className={cn(
                "text-xl font-bold",
                results.projectedSLA >= 95
                  ? "text-emerald-500"
                  : results.projectedSLA >= 85
                  ? "text-amber-500"
                  : "text-red-500"
              )}
            >
              {formatPercent(results.projectedSLA, 1)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">attainment</p>
          </CardContent>
        </Card>

        {/* Risk Score */}
        <Card className="border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Risk Score
              </span>
            </div>
            <p
              className={cn(
                "text-xl font-bold",
                results.projectedRiskScore >= 75
                  ? "text-red-500"
                  : results.projectedRiskScore >= 50
                  ? "text-orange-500"
                  : results.projectedRiskScore >= 25
                  ? "text-amber-500"
                  : "text-emerald-500"
              )}
            >
              {results.projectedRiskScore}
            </p>
            <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", riskBarColor)}
                style={{ width: `${results.projectedRiskScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Staffing Change */}
        <Card className="border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Staff Needed
              </span>
            </div>
            <p
              className={cn(
                "text-xl font-bold",
                results.recommendedStaffingChange > 0
                  ? "text-red-500"
                  : "text-emerald-500"
              )}
            >
              {results.recommendedStaffingChange > 0 ? "+" : ""}
              {results.recommendedStaffingChange}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">headcount</p>
          </CardContent>
        </Card>
      </div>

      {/* Expected bottleneck */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
        <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
        <div>
          <span className="text-xs text-muted-foreground">Expected Bottleneck: </span>
          <span className="text-sm font-semibold text-foreground">
            {results.expectedBottleneck}
          </span>
          <span className="text-xs text-muted-foreground ml-2">stage</span>
        </div>
      </div>

      {/* Warnings */}
      {results.warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Warnings
          </p>
          {results.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/15"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trend charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backlog trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">
              Projected Backlog Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={backlogChartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="simBacklog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: "11px",
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Backlog"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#simBacklog)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">
              Projected SLA Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={slaChartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="simSLA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[50, 100]}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: "11px",
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="SLA"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#simSLA)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
