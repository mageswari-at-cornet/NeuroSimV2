import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Area, AreaChart, Line } from "recharts";
import { cn } from "../../lib/utils";
import { ChevronDown, BarChart3 } from "lucide-react";
import type { UncertaintyOutcome } from "../../store/dashboardStore";

interface OutcomeData {
  metric: string;
  baseline: number;
  current: number;
  unit: string;
}

interface UncertaintyData {
  metric: string;
  baseline: UncertaintyOutcome;
  current: UncertaintyOutcome;
  unit: string;
}

interface OutcomeComparisonProps {
  data: OutcomeData[];
  uncertaintyData?: UncertaintyData[];
  simulationMode?: "deterministic" | "monte-carlo";
  className?: string;
  isCompact?: boolean;
}

export function OutcomeComparison({ data, uncertaintyData, simulationMode = "deterministic", className, isCompact }: OutcomeComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isMonteCarlo = simulationMode === "monte-carlo";

  // Prepare data for deterministic bar chart
  const chartData = data.map((item) => ({
    name: item.metric,
    baseline: item.baseline,
    current: item.current,
    delta: item.current - item.baseline,
    unit: item.unit,
  }));

  // Prepare data for Monte Carlo fan chart
  const fanChartData = uncertaintyData?.map((item) => ({
    name: item.metric,
    baselineP05: item.baseline.p05,
    baselineMean: item.baseline.mean,
    baselineP95: item.baseline.p95,
    currentP05: item.current.p05,
    currentMean: item.current.mean,
    currentP95: item.current.p95,
    unit: item.unit,
  })) ?? [];

  const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neuro-bg-tertiary border border-neuro-border-default rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-neuro-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neuro-text-secondary capitalize">
                {entry.dataKey}:
              </span>
              <span className="text-neuro-text-primary font-medium tabular-nums">
                {entry.value}%
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const FanTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const currentData = fanChartData.find(d => d.name === label);
      if (!currentData) return null;

      return (
        <div className="bg-neuro-bg-tertiary border border-neuro-border-default rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-neuro-text-primary mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-neuro-text-secondary">Current Scenario:</p>
            <p className="text-xs flex justify-between gap-4">
              <span className="text-neuro-text-tertiary">5th percentile:</span>
              <span className="text-neuro-text-primary font-medium tabular-nums">{currentData.currentP05}%</span>
            </p>
            <p className="text-xs flex justify-between gap-4">
              <span className="text-neuro-text-tertiary">Mean:</span>
              <span className="text-neuro-salvaged font-medium tabular-nums">{currentData.currentMean}%</span>
            </p>
            <p className="text-xs flex justify-between gap-4">
              <span className="text-neuro-text-tertiary">95th percentile:</span>
              <span className="text-neuro-text-primary font-medium tabular-nums">{currentData.currentP95}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("glass-panel", className)}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-neuro-bg-tertiary/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neuro-penumbra" />
          <h3 className="text-sm font-semibold text-neuro-text-primary">Outcome Comparison</h3>
        </div>

        <div className="flex items-center gap-3">
          {isMonteCarlo && (
            <span className="text-xs text-neuro-text-tertiary bg-neuro-bg-tertiary px-2 py-1 rounded">
              Monte Carlo (200+ runs)
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-5 h-5 text-neuro-text-secondary transition-transform",
              isExpanded && "transform rotate-180"
            )}
          />
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="h-48 mb-4">{" "}
            <ResponsiveContainer width="100%" height="100%">
              {isMonteCarlo ? (
                // Fan chart for Monte Carlo mode
                <AreaChart data={fanChartData} margin={{ top: 10, right: 10, left: 0, bottom: isCompact ? 30 : 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: isCompact ? 9 : 11 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    tickLine={false}
                    interval={0}
                    angle={isCompact ? -25 : -15}
                    textAnchor="end"
                    height={isCompact ? 40 : 30}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<FanTooltip />} />

                  {/* Baseline confidence band */}
                  <Area
                    type="monotone"
                    dataKey="baselineP95"
                    stackId="baseline"
                    stroke="none"
                    fill="#475569"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="baselineP05"
                    stackId="baseline"
                    stroke="none"
                    fill="#475569"
                    fillOpacity={0.1}
                  />

                  {/* Current confidence band */}
                  <Area
                    type="monotone"
                    dataKey="currentP95"
                    stackId="current"
                    stroke="none"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="currentP05"
                    stackId="current"
                    stroke="none"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                  />

                  {/* Mean lines */}
                  <Line
                    type="monotone"
                    dataKey="baselineMean"
                    stroke="#475569"
                    strokeWidth={2}
                    dot={{ fill: "#475569", strokeWidth: 0, r: 3 }}
                    name="Baseline Mean"
                  />
                  <Line
                    type="monotone"
                    dataKey="currentMean"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", strokeWidth: 0, r: 3 }}
                    name="Current Mean"
                  />
                </AreaChart>
              ) : (
                // Bar chart for deterministic mode
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: isCompact ? 30 : 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: isCompact ? 9 : 11 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    tickLine={false}
                    interval={0}
                    angle={isCompact ? -25 : -15}
                    textAnchor="end"
                    height={isCompact ? 40 : 30}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="baseline" name="Baseline" fill="#475569" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="current" name="Current" radius={[4, 4, 0, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.delta >= 0 ? "#06b6d4" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Monte Carlo Statistics */}
          {isMonteCarlo && fanChartData.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-neuro-bg-tertiary/30 border border-neuro-border-subtle">
              <h4 className="text-xs font-medium text-neuro-text-secondary mb-3">Statistics (90% confidence interval)</h4>
              <div className="grid grid-cols-3 gap-3">
                {fanChartData.map((metric) => (
                  <div key={metric.name} className="text-center">
                    <p className="text-[10px] text-neuro-text-tertiary mb-1">{metric.name}</p>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[9px] text-neuro-text-tertiary">P05:</span>
                        <span className="text-xs font-semibold text-neuro-text-primary tabular-nums">{metric.currentP05}%</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[9px] text-neuro-salvaged">Mean:</span>
                        <span className="text-sm font-bold text-neuro-salvaged tabular-nums">{metric.currentMean}%</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[9px] text-neuro-text-tertiary">P95:</span>
                        <span className="text-xs font-semibold text-neuro-text-primary tabular-nums">{metric.currentP95}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neuro-text-tertiary mt-2 text-center">90% of patients fall between P05-P95</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neuro-baseline" />
              <span className="text-xs text-neuro-text-secondary">Baseline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neuro-salvaged" />
              <span className="text-xs text-neuro-text-secondary">Current</span>
            </div>
          </div>

          {/* Delta Summary - Hidden in Monte Carlo mode */}
          {!isMonteCarlo && (
            <div className="pt-4 border-t border-neuro-border-subtle space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className={cn("flex justify-between items-center", isCompact ? "text-xs" : "text-sm")}>
                  <span className="text-neuro-text-secondary">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-neuro-text-tertiary tabular-nums", isCompact ? "text-[10px]" : "text-xs")}>
                      {item.baseline}%
                    </span>
                    <span className="text-neuro-text-secondary">→</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        isCompact ? "text-xs" : "text-sm",
                        item.delta > 0 ? "text-neuro-positive" : item.delta < 0 ? "text-neuro-negative" : "text-neuro-text-secondary"
                      )}
                    >
                      {item.current}%
                    </span>
                    <span
                      className={cn(
                        "font-medium tabular-nums w-12 text-right",
                        isCompact ? "text-[10px]" : "text-xs",
                        item.delta > 0 ? "text-neuro-positive" : item.delta < 0 ? "text-neuro-negative" : "text-neuro-text-secondary"
                      )}
                    >
                      ({item.delta > 0 ? "+" : ""}{item.delta}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}
