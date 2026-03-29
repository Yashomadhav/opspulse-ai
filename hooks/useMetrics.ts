// =============================================================
// OpsPulse AI — useMetrics Hook
// Polls /api/metrics at a configurable interval
// =============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FilterState, MetricsApiResponse } from "@/types";

const DEFAULT_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL ?? "15000",
  10
);

interface UseMetricsOptions {
  filters?: Partial<FilterState>;
  siteId?: string;
  shiftName?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
  enabled?: boolean;
}

export function useMetrics(options: UseMetricsOptions = {}) {
  const {
    filters = {},
    siteId,
    shiftName,
    refreshInterval = DEFAULT_INTERVAL,
    autoRefresh = true,
    enabled = true,
  } = options;

  // Merge siteId/shiftName shorthand into filters
  const effectiveSiteId = siteId ?? filters.siteId;
  const effectiveShiftName = shiftName ?? filters.shiftName;

  const [data, setData] = useState<MetricsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (effectiveSiteId && effectiveSiteId !== "all") {
      params.set("siteId", effectiveSiteId);
    }
    if (effectiveShiftName && effectiveShiftName !== "all") {
      params.set("shiftName", effectiveShiftName);
    }
    params.set("hoursBack", "12");
    return `/api/metrics?${params.toString()}`;
  }, [effectiveSiteId, effectiveShiftName]);

  const fetchMetrics = useCallback(async () => {
    if (!enabled) return;

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const response = await fetch(buildUrl(), {
        signal: abortRef.current.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.success) {
        setData(json.data as MetricsApiResponse);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error ?? "Unknown error");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl, enabled]);

  // Initial fetch + polling
  useEffect(() => {
    setIsLoading(true);
    fetchMetrics();

    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchMetrics, refreshInterval]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, isLoading, error, lastUpdated, refresh };
}
