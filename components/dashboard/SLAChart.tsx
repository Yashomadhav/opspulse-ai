"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendPoint } from "@/types";

interface SLAChartProps {
  data: TrendPoint[];
  target?: number;
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
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SLAChart({ data, target = 95, isLoading }: SLAChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">SLA Attainment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    time: d.label,
    "Site 1": d.site1 ?? d.value,
    "Site 2": d.site2 ?? d.value2,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">SLA Attainment</CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 bg-red-500/50 rounded border border-dashed border-red-500" />
            <span className="text-xs text-muted-foreground">Target {target}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[60, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={8}
            />
            <ReferenceLine
              y={target}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="Site 1"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="Site 2"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
