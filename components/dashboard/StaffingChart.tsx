"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendPoint } from "@/types";

interface StaffingChartProps {
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
              {entry.value} staff
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function StaffingChart({ data, isLoading }: StaffingChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Staffing vs Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    time: d.label,
    Active: d.value,
    Required: d.value2,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Staffing vs Required</CardTitle>
          <span className="text-xs text-muted-foreground">Headcount</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            <Bar
              dataKey="Active"
              fill="#10B981"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="Required"
              fill="#6366F1"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
              opacity={0.6}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
