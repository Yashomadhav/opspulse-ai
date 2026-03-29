"use client";

import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartDataPoint } from "@/types";

interface SiteComparisonChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SiteComparisonChart({ data, isLoading }: SiteComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Site Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Site Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={8}
            />
            <Radar
              name="Site 1 — Northgate"
              dataKey="site1"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Site 2 — Southpark"
              dataKey="site2"
              stroke="#0EA5E9"
              fill="#0EA5E9"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
