// =============================================================
// OpsPulse AI — /api/recommendations Route Handler
// Returns AI-generated operational recommendations
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
const VALID_PRIORITIES = new Set(["all", "urgent", "high", "medium", "low"]);
const VALID_CATEGORIES = new Set([
  "all", "staffing", "throughput", "escalation", "process", "sla",
]);

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);

  try {
    const { searchParams } = new URL(request.url);

    // ── Sanitize & validate query parameters ──────────────
    const rawSiteId = searchParams.get("siteId") ?? "all";
    const rawPriority = searchParams.get("priority") ?? "all";
    const rawCategory = searchParams.get("category") ?? "all";
    const rawLimit = searchParams.get("limit") ?? "30";

    const siteId =
      rawSiteId === "all" || isSafeIdentifier(rawSiteId) ? rawSiteId : "all";
    const priority = VALID_PRIORITIES.has(rawPriority) ? rawPriority : "all";
    const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : "all";
    const limitRaw = parseInt(rawLimit, 10);
    const limit = isNaN(limitRaw) ? 30 : Math.min(Math.max(limitRaw, 1), 100);

    auditLog({
      event: "api_request",
      timestamp: new Date().toISOString(),
      ip,
      path: "/api/recommendations",
      method: "GET",
      userAgent: request.headers.get("user-agent") ?? "unknown",
      details: { siteId, priority, category, limit },
    });

    if (useMockData()) {
      const historical = generateHistoricalData(6);
      let recommendations = historical.recommendations;

      // Apply filters
      if (siteId !== "all") {
        recommendations = recommendations.filter((r) => r.siteId === siteId);
      }
      if (priority !== "all") {
        recommendations = recommendations.filter((r) => r.priority === priority);
      }
      if (category !== "all") {
        recommendations = recommendations.filter((r) => r.category === category);
      }

      // Sort by priority then timestamp
      const priorityOrder: Record<string, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      recommendations = recommendations
        .sort((a, b) => {
          const pDiff =
            (priorityOrder[a.priority] ?? 4) -
            (priorityOrder[b.priority] ?? 4);
          if (pDiff !== 0) return pDiff;
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        })
        .slice(0, limit);

      // Enrich with site and shift names
      const enriched = recommendations.map((rec) => ({
        ...rec,
        siteName:
          SITES.find((s) => s.id === rec.siteId)?.name ?? rec.siteId,
        shiftName:
          SHIFTS.find((s) => s.id === rec.shiftId)?.name ?? rec.shiftId,
      }));

      // Summary
      const summary = {
        total: enriched.length,
        urgent: enriched.filter((r) => r.priority === "urgent").length,
        high: enriched.filter((r) => r.priority === "high").length,
        medium: enriched.filter((r) => r.priority === "medium").length,
        low: enriched.filter((r) => r.priority === "low").length,
        byCategory: {
          staffing: enriched.filter((r) => r.category === "staffing").length,
          throughput: enriched.filter((r) => r.category === "throughput").length,
          escalation: enriched.filter((r) => r.category === "escalation").length,
          process: enriched.filter((r) => r.category === "process").length,
          sla: enriched.filter((r) => r.category === "sla").length,
        },
      };

      return NextResponse.json({
        success: true,
        data: { recommendations: enriched, summary },
        timestamp: new Date().toISOString(),
      });
    }

    // ── Supabase path ──────────────────────────────────────
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // If client couldn't be created, fall back to mock data
    if (!supabase) {
      const historical = generateHistoricalData(6);
      const recs = historical.recommendations.slice(0, limit).map((rec) => ({
        ...rec,
        siteName: SITES.find((s) => s.id === rec.siteId)?.name ?? rec.siteId,
        shiftName: SHIFTS.find((s) => s.id === rec.shiftId)?.name ?? rec.shiftId,
      }));
      return NextResponse.json({
        success: true,
        data: { recommendations: recs, summary: {} },
        timestamp: new Date().toISOString(),
      });
    }

    let query = supabase
      .from("recommendations")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (siteId !== "all") query = query.eq("site_id", siteId);
    if (priority !== "all") query = query.eq("priority", priority);
    if (category !== "all") query = query.eq("category", category);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase recommendations error:", error);
      return GET(request);
    }

    const recommendations = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      timestamp: row.timestamp,
      siteId: row.site_id,
      shiftId: row.shift_id,
      category: row.category,
      priority: row.priority,
      message: row.message,
      expectedImpact: row.expected_impact,
      businessReason: row.business_reason,
      siteName: SITES.find((s) => s.id === row.site_id)?.name ?? row.site_id,
      shiftName: SHIFTS.find((s) => s.id === row.shift_id)?.name ?? row.shift_id,
    }));

    return NextResponse.json({
      success: true,
      data: { recommendations, summary: {} },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const safe = safeErrorResponse(error, "Failed to fetch recommendations. Please try again.", 500);
    return NextResponse.json({ success: false, error: safe.message, timestamp: safe.timestamp }, { status: 500 });
  }
}
