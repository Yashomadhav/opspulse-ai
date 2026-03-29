"use client";

import React, { useState, useCallback } from "react";
import {
  FlaskConical,
  Play,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { SimulatorResultsPanel } from "@/components/simulator/SimulatorResults";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SimulatorInputs, SimulatorResults as SimResults } from "@/types";
import {
  pageVariants,
  staggerContainer,
  cardVariants,
  fadeIn,
  springSmooth,
  springBouncy,
} from "@/lib/motion";

// ─── Default Inputs ───────────────────────────────────────────

const DEFAULT_INPUTS: SimulatorInputs = {
  siteId: "site-1",
  shiftName: "Shift A",
  demandIncrease: 0,
  absenteeismIncrease: 0,
  throughputDecrease: 0,
  staffingChange: 0,
  processDelayIncrease: 0,
};

// ─── Preset Scenarios ─────────────────────────────────────────

const PRESETS = [
  {
    label: "Peak Demand Surge",
    description: "+30% demand, -5% throughput",
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    inputs: { demandIncrease: 30, throughputDecrease: 5, absenteeismIncrease: 0, staffingChange: 0, processDelayIncrease: 0 },
  },
  {
    label: "High Absenteeism",
    description: "+20% absenteeism, -3 staff",
    icon: Users,
    color: "text-red-500",
    bg: "bg-red-500/10",
    inputs: { absenteeismIncrease: 20, staffingChange: -3, demandIncrease: 0, throughputDecrease: 0, processDelayIncrease: 0 },
  },
  {
    label: "Process Breakdown",
    description: "+40% delay, -15% throughput",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    inputs: { processDelayIncrease: 40, throughputDecrease: 15, demandIncrease: 0, absenteeismIncrease: 0, staffingChange: 0 },
  },
  {
    label: "Staffing Boost",
    description: "+5 staff, +10% throughput",
    icon: TrendingDown,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    inputs: { staffingChange: 5, throughputDecrease: -10, demandIncrease: 0, absenteeismIncrease: 0, processDelayIncrease: 0 },
  },
  {
    label: "Black Friday",
    description: "+50% demand, +15% absenteeism",
    icon: Package,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    inputs: { demandIncrease: 50, absenteeismIncrease: 15, throughputDecrease: 10, staffingChange: 0, processDelayIncrease: 5 },
  },
];

// ─── Slider Config ────────────────────────────────────────────

interface SliderConfig {
  key: keyof Omit<SimulatorInputs, "siteId" | "shiftName">;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  positiveColor: string;
  negativeColor: string;
  description: string;
}

const SLIDERS: SliderConfig[] = [
  {
    key: "demandIncrease",
    label: "Demand Increase",
    min: 0, max: 100, step: 5, unit: "%",
    positiveColor: "text-orange-500",
    negativeColor: "text-emerald-500",
    description: "Simulate a surge in incoming order volume",
  },
  {
    key: "absenteeismIncrease",
    label: "Absenteeism Increase",
    min: 0, max: 50, step: 2, unit: "%",
    positiveColor: "text-red-500",
    negativeColor: "text-emerald-500",
    description: "Simulate higher staff absence rate",
  },
  {
    key: "throughputDecrease",
    label: "Throughput Change",
    min: -20, max: 50, step: 5, unit: "%",
    positiveColor: "text-amber-500",
    negativeColor: "text-emerald-500",
    description: "Negative = improvement, Positive = degradation",
  },
  {
    key: "staffingChange",
    label: "Staffing Change",
    min: -10, max: 20, step: 1, unit: " staff",
    positiveColor: "text-emerald-500",
    negativeColor: "text-red-500",
    description: "Add or remove associates from the shift",
  },
  {
    key: "processDelayIncrease",
    label: "Process Delay Increase",
    min: 0, max: 60, step: 5, unit: "%",
    positiveColor: "text-amber-500",
    negativeColor: "text-emerald-500",
    description: "Simulate upstream or stage-level delays",
  },
];

// ─── Page Component ───────────────────────────────────────────

export default function SimulatorPage() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<SimResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleSliderChange = useCallback(
    (key: keyof Omit<SimulatorInputs, "siteId" | "shiftName">, value: number[]) => {
      setInputs((prev) => ({ ...prev, [key]: value[0] }));
      setActivePreset(null);
    },
    []
  );

  const applyPreset = useCallback((preset: (typeof PRESETS)[0]) => {
    setInputs((prev) => ({ ...prev, ...preset.inputs }));
    setResults(null);
    setActivePreset(preset.label);
  }, []);

  const resetInputs = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setResults(null);
    setError(null);
    setActivePreset(null);
  }, []);

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (json.success) {
        const simResults: SimResults = json.data?.results ?? json.data;
        setResults(simResults);
      } else {
        setError(json.error ?? "Simulation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run simulation");
    } finally {
      setIsRunning(false);
    }
  }, [inputs]);

  const hasChanges = Object.entries(inputs).some(([key, val]) => {
    if (key === "siteId" || key === "shiftName") return false;
    return val !== 0;
  });

  return (
    <AppShell>
      <TopBar
        title="Scenario Simulator"
        subtitle="Model what-if scenarios to predict operational impact before they happen"
      />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-6"
      >
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* ── Left Panel: Controls ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="xl:col-span-2 space-y-5"
          >
            {/* Site & Shift selectors */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Simulation Context</CardTitle>
                  <CardDescription className="text-xs">
                    Select the site and shift to simulate against
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Site</label>
                    <Select
                      value={inputs.siteId}
                      onValueChange={(v) => setInputs((p) => ({ ...p, siteId: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="site-1">Site 1 — Northgate, Manchester</SelectItem>
                        <SelectItem value="site-2">Site 2 — Southpark, Birmingham</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Shift</label>
                    <Select
                      value={inputs.shiftName}
                      onValueChange={(v) => setInputs((p) => ({ ...p, shiftName: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shift A">Shift A (06:00–14:00)</SelectItem>
                        <SelectItem value="Shift B">Shift B (14:00–22:00)</SelectItem>
                        <SelectItem value="Shift C">Shift C (22:00–06:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preset scenarios */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Quick Presets</CardTitle>
                  <CardDescription className="text-xs">
                    Load a pre-configured scenario
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {PRESETS.map((preset, i) => {
                    const Icon = preset.icon;
                    const isActive = activePreset === preset.label;
                    return (
                      <motion.button
                        key={preset.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, ...springSmooth }}
                        whileHover={{ x: 4, transition: springSmooth }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => applyPreset(preset)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                          isActive
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:bg-accent/50"
                        }`}
                      >
                        <motion.div
                          animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                          transition={{ duration: 0.4 }}
                          className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${preset.bg}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${preset.color}`} />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{preset.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springBouncy}
                            className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sliders */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Scenario Parameters</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Adjust variables to model your scenario
                      </CardDescription>
                    </div>
                    <AnimatePresence>
                      {hasChanges && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={springBouncy}
                        >
                          <Badge variant="warning" className="text-xs">
                            Modified
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {SLIDERS.map((slider, i) => {
                    const value = inputs[slider.key] as number;
                    const isPositive = value > 0;
                    const isNegative = value < 0;
                    const displayColor =
                      slider.key === "staffingChange"
                        ? isPositive
                          ? slider.positiveColor
                          : isNegative
                          ? slider.negativeColor
                          : "text-muted-foreground"
                        : isPositive
                        ? slider.positiveColor
                        : "text-muted-foreground";

                    return (
                      <motion.div
                        key={slider.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-foreground">{slider.label}</p>
                            <p className="text-xs text-muted-foreground/70">{slider.description}</p>
                          </div>
                          <motion.span
                            key={value}
                            initial={{ scale: 1.3, opacity: 0.6 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={springSmooth}
                            className={`text-sm font-bold tabular-nums ${displayColor}`}
                          >
                            {value > 0 ? "+" : ""}
                            {value}
                            {slider.unit}
                          </motion.span>
                        </div>
                        <Slider
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          value={[value]}
                          onValueChange={(v) => handleSliderChange(slider.key, v)}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground/50">
                          <span>{slider.min}{slider.unit}</span>
                          <span>{slider.max}{slider.unit}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Action buttons */}
            <motion.div variants={fadeIn} className="flex gap-3">
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={runSimulation}
                  disabled={isRunning}
                  className="w-full gap-2"
                >
                  <motion.div
                    animate={isRunning ? { rotate: 360 } : { rotate: 0 }}
                    transition={isRunning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                  >
                    <Play className="w-4 h-4" />
                  </motion.div>
                  {isRunning ? "Running..." : "Run Simulation"}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={resetInputs}
                  disabled={isRunning}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── Right Panel: Results ── */}
          <div className="xl:col-span-3">
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.98 }}
                  transition={springSmooth}
                >
                  <SimulatorResultsPanel results={results} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-xl border border-dashed border-border bg-muted/10 text-center p-8"
                >
                  <motion.div
                    animate={{
                      y: [0, -6, 0],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                  >
                    <FlaskConical className="w-8 h-8 text-primary/50" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Configure & Run a Simulation
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Adjust the scenario parameters on the left, or select a quick preset, then click{" "}
                    <span className="font-medium text-foreground">Run Simulation</span> to see projected
                    operational impact.
                  </p>
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm text-left"
                  >
                    {[
                      { label: "Projected Backlog", desc: "End-of-shift estimate" },
                      { label: "SLA Risk", desc: "Attainment forecast" },
                      { label: "Risk Score", desc: "0–100 composite score" },
                      { label: "Staffing Advice", desc: "Recommended headcount" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <p className="text-xs font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
