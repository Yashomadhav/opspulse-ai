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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartDataPoint } from "@/types";
import { STAGE_COLORS } from "@/lib/utils";

interface ProcessStageChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ProcessStageChart({ data, isLoading }: ProcessStageChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Process Stage Performance</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Process Stage Performance</CardTitle>
          <span className="text-xs text-muted-foreground">Volume Processed</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STAGE_COLORS[entry.name as string] ?? "#6366F1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Stage legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
          {Object.entries(STAGE_COLORS).map(([stage, color]) => (
            <div key={stage} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{stage}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
