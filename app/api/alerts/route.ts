// =============================================================
// OpsPulse AI — /api/alerts Route Handler
// Returns live operational alerts feed
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateCurrentSnapshot,
  generateHistoricalData,
  SITES,
  SHIFTS,
} from "@/lib/data-generator";
import { useMockData } from "@/lib/supabase";
import { isSafeIdentifier, safeErrorResponse, auditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Allowlisted values for enum-type query params
const VALID_SEVERITIES = new Set(["all", "critical", "high", "warning", "info"]);
const VALID_STATUSES = new Set(["all", "active", "acknowledged", "resolved"]);

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);

  try {
    const { searchParams } = new URL(request.url);

    // ── Sanitize & validate query parameters ──────────────
    const rawSiteId = searchParams.get("siteId") ?? "all";
    const rawSeverity = searchParams.get("severity") ?? "all";
    const rawStatus = searchParams.get("status") ?? "all";
    const rawLimit = searchParams.get("limit") ?? "50";

    // Validate siteId — only safe identifiers
    const siteId =
      rawSiteId === "all" || isSafeIdentifier(rawSiteId) ? rawSiteId : "all";

    // Validate severity — only allowlisted values (prevents injection)
    const severity = VALID_SEVERITIES.has(rawSeverity) ? rawSeverity : "all";

    // Validate status — only allowlisted values
    const status = VALID_STATUSES.has(rawStatus) ? rawStatus : "all";

    // Clamp limit to 1–200 to prevent large data dumps
    const limitRaw = parseInt(rawLimit, 10);
    const limit = isNaN(limitRaw) ? 50 : Math.min(Math.max(limitRaw, 1), 200);

    auditLog({
      event: "api_request",
      timestamp: new Date().toISOString(),
      ip,
      path: "/api/alerts",
      method: "GET",
      userAgent: request.headers.get("user-agent") ?? "unknown",
      details: { siteId, severity, status, limit },
    });

    if (useMockData()) {
      const historical = generateHistoricalData(8);
      let alerts = historical.alerts;

      // Apply filters
      if (siteId !== "all") {
        alerts = alerts.filter((a) => a.siteId === siteId);
      }
      if (severity !== "all") {
        alerts = alerts.filter((a) => a.severity === severity);
      }
      if (status !== "all") {
        alerts = alerts.filter((a) => a.status === status);
      }

      // Sort by timestamp descending, limit
      alerts = alerts
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);

      // Enrich with site and shift names
      const enriched = alerts.map((alert) => ({
        ...alert,
        siteName:
          SITES.find((s) => s.id === alert.siteId)?.name ?? alert.siteId,
        shiftName:
          SHIFTS.find((s) => s.id === alert.shiftId)?.name ?? alert.shiftId,
      }));

      // Summary counts
      const summary = {
        total: enriched.length,
        critical: enriched.filter((a) => a.severity === "critical").length,
        warning: enriched.filter((a) => a.severity === "warning").length,
        info: enriched.filter((a) => a.severity === "info").length,
        active: enriched.filter((a) => a.status === "active").length,
        acknowledged: enriched.filter((a) => a.status === "acknowledged").length,
        resolved: enriched.filter((a) => a.status === "resolved").length,
      };

      return NextResponse.json({
        success: true,
        data: { alerts: enriched, summary },
        timestamp: new Date().toISOString(),
      });
    }

    // ── Supabase path ──────────────────────────────────────
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // If client couldn't be created, fall back to mock data
    if (!supabase) {
      const historical = generateHistoricalData(8);
      const alerts = historical.alerts.slice(0, limit).map((alert) => ({
        ...alert,
        siteName: SITES.find((s) => s.id === alert.siteId)?.name ?? alert.siteId,
        shiftName: SHIFTS.find((s) => s.id === alert.shiftId)?.name ?? alert.shiftId,
      }));
      return NextResponse.json({
        success: true,
        data: {
          alerts,
          summary: {
            total: alerts.length,
            critical: alerts.filter((a) => a.severity === "critical").length,
            warning: alerts.filter((a) => a.severity === "warning").length,
            info: alerts.filter((a) => a.severity === "info").length,
            active: alerts.filter((a) => a.status === "active").length,
            acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
            resolved: alerts.filter((a) => a.status === "resolved").length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    let query = supabase
      .from("alerts")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (siteId !== "all") query = query.eq("site_id", siteId);
    if (severity !== "all") query = query.eq("severity", severity);
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase alerts error:", error);
      // Fallback to mock
      return GET(request);
    }

    const alerts = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      timestamp: row.timestamp,
      siteId: row.site_id,
      shiftId: row.shift_id,
      severity: row.severity,
      alertType: row.alert_type,
      message: row.message,
      status: row.status,
      siteName: SITES.find((s) => s.id === row.site_id)?.name ?? row.site_id,
      shiftName: SHIFTS.find((s) => s.id === row.shift_id)?.name ?? row.shift_id,
    }));

    const summary = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
      active: alerts.filter((a) => a.status === "active").length,
      acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
    };

    return NextResponse.json({
      success: true,
      data: { alerts, summary },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const safe = safeErrorResponse(error, "Failed to fetch alerts. Please try again.", 500);
    return NextResponse.json({ success: false, error: safe.message, timestamp: safe.timestamp }, { status: 500 });
  }
}
