// =============================================================
// OpsPulse AI — /api/metrics Route Handler
// Returns current ops metrics, KPIs, and trend data
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateCurrentSnapshot,
  generateHistoricalData,
  generateTrendData,
  computeKPIs,
  SITES,
  SHIFTS,
} from "@/lib/data-generator";
import { useMockData } from "@/lib/supabase";
import { isSafeIdentifier, safeErrorResponse, auditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const path = "/api/metrics";

  try {
    const { searchParams } = new URL(request.url);

    // ── Sanitize & validate query parameters ──────────────
    const rawSiteId = searchParams.get("siteId") ?? "all";
    const rawShiftId = searchParams.get("shiftId") ?? "all";
    const rawHoursBack = searchParams.get("hoursBack") ?? "12";

    // Validate identifiers — only allow safe alphanumeric values
    const siteId =
      rawSiteId === "all" || isSafeIdentifier(rawSiteId) ? rawSiteId : "all";
    const shiftId =
      rawShiftId === "all" || isSafeIdentifier(rawShiftId) ? rawShiftId : "all";

    // Clamp hoursBack to 1–168 (1 hour to 1 week) to prevent abuse
    const hoursBackRaw = parseInt(rawHoursBack, 10);
    const hoursBack = isNaN(hoursBackRaw)
      ? 12
      : Math.min(Math.max(hoursBackRaw, 1), 168);

    auditLog({
      event: "api_request",
      timestamp: new Date().toISOString(),
      ip,
      path,
      method: "GET",
      userAgent: request.headers.get("user-agent") ?? "unknown",
      details: { siteId, shiftId, hoursBack },
    });

    // ── Use mock/synthetic data (default for demo) ─────────
    if (useMockData()) {
      const historical = generateHistoricalData(hoursBack);
      const snapshot = generateCurrentSnapshot();

      // Filter by site if requested
      let filteredOpsMetrics = snapshot.opsMetrics;
      let filteredProcessMetrics = snapshot.processMetrics;

      if (siteId !== "all") {
        filteredOpsMetrics = filteredOpsMetrics.filter(
          (m) => m.siteId === siteId
        );
        filteredProcessMetrics = filteredProcessMetrics.filter(
          (m) => m.siteId === siteId
        );
      }

      if (shiftId !== "all") {
        filteredOpsMetrics = filteredOpsMetrics.filter(
          (m) => m.shiftId === shiftId
        );
        filteredProcessMetrics = filteredProcessMetrics.filter(
          (m) => m.shiftId === shiftId
        );
      }

      const kpis = computeKPIs(filteredOpsMetrics);
      const trends = generateTrendData(historical.opsMetrics, 30, 24);

      // Site comparison chart data
      const siteComparison = SITES.map((site) => {
        const siteMetrics = snapshot.opsMetrics.filter(
          (m) => m.siteId === site.id
        );
        const avg = computeKPIs(siteMetrics);
        return {
          name: site.name.split(" ")[0], // Short name
          throughput: avg.avgThroughputPerHour,
          sla: avg.avgSlaAttainment,
          backlog: avg.totalBacklog,
          riskScore: avg.overallRiskScore,
        };
      });

      // Process stage comparison
      const stageComparison = ["Inbound", "Picking", "Packing", "Dispatch"].map(
        (stage) => {
          const stageMetrics = filteredProcessMetrics.filter(
            (m) => m.processStage === stage
          );
          const avgCycleTime =
            stageMetrics.length > 0
              ? stageMetrics.reduce((s, m) => s + m.cycleTime, 0) /
                stageMetrics.length
              : 0;
          const avgRisk =
            stageMetrics.length > 0
              ? stageMetrics.reduce((s, m) => s + m.stageRiskScore, 0) /
                stageMetrics.length
              : 0;
          const totalExceptions = stageMetrics.reduce(
            (s, m) => s + m.exceptionCount,
            0
          );
          return {
            name: stage,
            cycleTime: Math.round(avgCycleTime * 100) / 100,
            riskScore: Math.round(avgRisk),
            exceptions: totalExceptions,
            volume: stageMetrics.reduce((s, m) => s + m.processedVolume, 0),
          };
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          opsMetrics: filteredOpsMetrics,
          processMetrics: filteredProcessMetrics,
          kpis,
          throughputTrend: trends.throughputTrend,
          backlogTrend: trends.backlogTrend,
          slaTrend: trends.slaTrend,
          staffingTrend: trends.staffingTrend,
          siteComparison,
          stageComparison,
          sites: SITES,
          shifts: SHIFTS,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ── Supabase data path ─────────────────────────────────
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // If client couldn't be created, fall back to mock data
    if (!supabase) {
      const historical = generateHistoricalData(hoursBack);
      const snapshot = generateCurrentSnapshot();
      const kpis = computeKPIs(snapshot.opsMetrics);
      const trends = generateTrendData(historical.opsMetrics, 30, 24);
      return NextResponse.json({
        success: true,
        data: {
          opsMetrics: snapshot.opsMetrics,
          processMetrics: snapshot.processMetrics,
          kpis,
          throughputTrend: trends.throughputTrend,
          backlogTrend: trends.backlogTrend,
          slaTrend: trends.slaTrend,
          staffingTrend: trends.staffingTrend,
          siteComparison: [],
          stageComparison: [],
          sites: SITES,
          shifts: SHIFTS,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const since = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000
    ).toISOString();

    let opsQuery = supabase
      .from("ops_metrics")
      .select("*")
      .gte("timestamp", since)
      .order("timestamp", { ascending: false })
      .limit(200);

    if (siteId !== "all") opsQuery = opsQuery.eq("site_id", siteId);
    if (shiftId !== "all") opsQuery = opsQuery.eq("shift_id", shiftId);

    const { data: opsData, error: opsError } = await opsQuery;

    if (opsError) {
      console.error("Supabase ops_metrics error:", opsError);
      // Fallback to mock data
      return GET(request);
    }

    // Map snake_case DB columns to camelCase
    const opsMetrics = (opsData ?? []).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      siteId: row.site_id,
      shiftId: row.shift_id,
      incomingOrders: row.incoming_orders,
      processedOrders: row.processed_orders,
      backlog: row.backlog,
      throughputPerHour: row.throughput_per_hour,
      slaAttainment: row.sla_attainment,
      avgProcessingTime: row.avg_processing_time,
      activeStaff: row.active_staff,
      requiredStaff: row.required_staff,
      staffingGap: row.staffing_gap,
      absenteeismRate: row.absenteeism_rate,
      utilizationRate: row.utilization_rate,
      riskScore: row.risk_score,
      predictedEndShiftBacklog: row.predicted_end_shift_backlog,
    }));

    const kpis = computeKPIs(opsMetrics);

    return NextResponse.json({
      success: true,
      data: {
        opsMetrics,
        processMetrics: [],
        kpis,
        throughputTrend: [],
        backlogTrend: [],
        slaTrend: [],
        staffingTrend: [],
        siteComparison: [],
        stageComparison: [],
        sites: SITES,
        shifts: SHIFTS,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const safe = safeErrorResponse(error, "Failed to fetch metrics. Please try again.", 500);
    return NextResponse.json({ success: false, error: safe.message, timestamp: safe.timestamp }, { status: 500 });
  }
}
