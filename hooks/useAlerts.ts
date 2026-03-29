// =============================================================
// OpsPulse AI — useAlerts Hook
// Polls /api/alerts at a configurable interval
// =============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "@/types";

interface UseAlertsOptions {
  siteId?: string;
  severity?: string;
  status?: string;
  limit?: number;
  refreshInterval?: number;
  autoRefresh?: boolean;
  enabled?: boolean;
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const {
    siteId = "all",
    severity = "all",
    status = "all",
    limit = 50,
    refreshInterval = 15000,
    autoRefresh = true,
    enabled = true,
  } = options;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (siteId !== "all") params.set("siteId", siteId);
    if (severity !== "all") params.set("severity", severity);
    if (status !== "all") params.set("status", status);
    params.set("limit", limit.toString());
    return `/api/alerts?${params.toString()}`;
  }, [siteId, severity, status, limit]);

  const fetchAlerts = useCallback(async () => {
    if (!enabled) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch(buildUrl(), {
        signal: abortRef.current.signal,
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (json.success) {
        setAlerts((json.data?.alerts as Alert[]) ?? []);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error ?? "Unknown error");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl, enabled]);

  useEffect(() => {
    setIsLoading(true);
    fetchAlerts();

    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchAlerts, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAlerts, refreshInterval]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, isLoading, error, lastUpdated, refresh };
}
