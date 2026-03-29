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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendPoint } from "@/types";

interface ThroughputChartProps {
  data: TrendPoint[];
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
              {entry.value.toLocaleString()} /hr
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ThroughputChart({ data, isLoading }: ThroughputChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Throughput Trend</CardTitle>
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
          <CardTitle className="text-sm font-semibold">Throughput Trend</CardTitle>
          <span className="text-xs text-muted-foreground">Orders / Hour</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="throughputSite1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="throughputSite2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="Site 1"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#throughputSite1)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="Site 2"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#throughputSite2)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
