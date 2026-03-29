// =============================================================
// OpsPulse AI — /api/simulate Route Handler
// Runs what-if scenario simulations
// Hardened: Zod validation, audit logging, safe errors, no stack traces
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulator";
import { SimulatorInputs } from "@/types";
import { z } from "zod";
import { safeErrorResponse, auditLog, getClientIp, isSafeIdentifier } from "@/lib/security";

export const dynamic = "force-dynamic";

// ─── Input Validation Schema ──────────────────────────────────
// Strict bounds on all numeric inputs to prevent abuse.
// siteId/shiftName are optional context fields — sanitized but not used in computation.

const SimulatorInputSchema = z.object({
  // Optional context fields — validated but not used in computation
  siteId: z.string().max(64).optional(),
  shiftName: z.string().max(64).optional(),
  // Scenario parameters — all strictly bounded
  demandIncrease: z.number().min(0).max(200).default(0),
  absenteeismIncrease: z.number().min(0).max(100).default(0),
  // Negative = throughput improvement, positive = degradation
  throughputDecrease: z.number().min(-100).max(100).default(0),
  staffingChange: z.number().min(-50).max(100).default(0),
  processDelayIncrease: z.number().min(0).max(200).default(0),
});

// ─── POST — Run simulation ────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const timestamp = new Date().toISOString();

  try {
    // Parse JSON body — catch malformed JSON explicitly
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      auditLog({
        event: "validation_failure",
        timestamp,
        ip,
        path: "/api/simulate",
        method: "POST",
        userAgent: request.headers.get("user-agent") ?? "unknown",
        details: { reason: "malformed_json" },
      });
      return NextResponse.json(
        { success: false, error: "Invalid JSON body", timestamp },
        { status: 400 }
      );
    }

    // Validate inputs with Zod
    const parseResult = SimulatorInputSchema.safeParse(body);
    if (!parseResult.success) {
      auditLog({
        event: "validation_failure",
        timestamp,
        ip,
        path: "/api/simulate",
        method: "POST",
        userAgent: request.headers.get("user-agent") ?? "unknown",
        details: { errors: parseResult.error.flatten().fieldErrors },
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid simulation inputs. Check parameter ranges.",
          // Only expose field names, not internal Zod details
          fields: Object.keys(parseResult.error.flatten().fieldErrors),
          timestamp,
        },
        { status: 400 }
      );
    }

    // Sanitize optional string fields
    const rawData = parseResult.data;
    if (rawData.siteId && !isSafeIdentifier(rawData.siteId)) {
      rawData.siteId = undefined;
    }
    if (rawData.shiftName) {
      // Allow shift names like "Morning", "Afternoon", "Night"
      rawData.shiftName = rawData.shiftName.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 32);
    }

    const inputs: SimulatorInputs = rawData;
    const results = runSimulation(inputs);

    auditLog({
      event: "simulation_run",
      timestamp,
      ip,
      path: "/api/simulate",
      method: "POST",
      userAgent: request.headers.get("user-agent") ?? "unknown",
      details: {
        demandIncrease: inputs.demandIncrease,
        absenteeismIncrease: inputs.absenteeismIncrease,
        throughputDecrease: inputs.throughputDecrease,
        projectedRisk: results.projectedRiskScore,
      },
    });

    return NextResponse.json({
      success: true,
      data: { inputs, results },
      timestamp,
    });
  } catch (error) {
    const safe = safeErrorResponse(error, "Simulation failed. Please try again.", 500);
    return NextResponse.json(
      { success: false, error: safe.message, timestamp: safe.timestamp },
      { status: 500 }
    );
  }
}

// ─── GET — Return baseline + presets ─────────────────────────

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);

  try {
    auditLog({
      event: "api_request",
      timestamp: new Date().toISOString(),
      ip,
      path: "/api/simulate",
      method: "GET",
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    const baselineInputs: SimulatorInputs = {
      demandIncrease: 0,
      absenteeismIncrease: 0,
      throughputDecrease: 0,
      staffingChange: 0,
      processDelayIncrease: 0,
    };

    const results = runSimulation(baselineInputs);

    return NextResponse.json({
      success: true,
      data: {
        inputs: baselineInputs,
        results,
        presets: [
          {
            name: "Demand Spike",
            description: "+25% demand increase",
            inputs: { demandIncrease: 25, absenteeismIncrease: 0, throughputDecrease: 0, staffingChange: 0, processDelayIncrease: 0 },
          },
          {
            name: "High Absenteeism",
            description: "+40% absenteeism increase",
            inputs: { demandIncrease: 0, absenteeismIncrease: 40, throughputDecrease: 0, staffingChange: 0, processDelayIncrease: 0 },
          },
          {
            name: "Peak Season",
            description: "+30% demand, +15% absenteeism",
            inputs: { demandIncrease: 30, absenteeismIncrease: 15, throughputDecrease: 0, staffingChange: 5, processDelayIncrease: 0 },
          },
          {
            name: "System Degradation",
            description: "-20% throughput, +10% process delay",
            inputs: { demandIncrease: 0, absenteeismIncrease: 0, throughputDecrease: 20, staffingChange: 0, processDelayIncrease: 10 },
          },
          {
            name: "Worst Case",
            description: "+40% demand, +30% absenteeism, -15% throughput",
            inputs: { demandIncrease: 40, absenteeismIncrease: 30, throughputDecrease: 15, staffingChange: -5, processDelayIncrease: 20 },
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const safe = safeErrorResponse(error, "Failed to load simulator.", 500);
    return NextResponse.json(
      { success: false, error: safe.message, timestamp: safe.timestamp },
      { status: 500 }
    );
  }
}
