import { useState } from "react";
import { cn } from "../../lib/utils";
import { TissueFateDonut } from "./TissueFateDonut";
import { OutcomeComparison } from "./OutcomeComparison";
import type { OutcomeMetrics, UncertaintyOutcome } from "../../store/dashboardStore";
import { BarChart3, Table as TableIcon, Activity, Brain, Heart, AlertTriangle, Skull, TrendingUp } from "lucide-react";

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

interface OutcomeAnalysisSectionProps {
    tissueData: {
        core: number;
        salvaged: number;
        atRisk: number;
    };
    outcomeData: OutcomeData[];
    uncertaintyData?: UncertaintyData[];
    baselineOutcomes: OutcomeMetrics;
    currentOutcomes: OutcomeMetrics;
    simulationMode?: "deterministic" | "monte-carlo";
    simulationSource?: "llm" | "local";
    className?: string;
    isCompact?: boolean;
}

export function OutcomeAnalysisSection(props: OutcomeAnalysisSectionProps) {
    const [viewMode, setViewMode] = useState<"visual" | "numerical">("visual");

    const {
        tissueData,
        outcomeData,
        uncertaintyData,
        baselineOutcomes,
        currentOutcomes,
        simulationMode,
        simulationSource,
        className,
        isCompact
    } = props;

    // Calculate changes for the table
    const getChange = (current: number, baseline: number) => {
        const delta = current - baseline;
        return {
            value: delta,
            percent: baseline !== 0 ? (delta / baseline) * 100 : 0,
        };
    };

    const tableRows = [
        {
            category: "Tissue Fate",
            metric: "Final Core Volume",
            baseline: baselineOutcomes.finalCoreVolume,
            current: currentOutcomes.finalCoreVolume,
            unit: "cc",
            icon: <Brain className="w-4 h-4 text-neuro-core" />,
            invertColor: true,
        },
        {
            category: "Tissue Fate",
            metric: "Penumbra Salvaged",
            baseline: baselineOutcomes.penumbraSalvaged,
            current: currentOutcomes.penumbraSalvaged,
            unit: "cc",
            icon: <Heart className="w-4 h-4 text-neuro-salvaged" />,
            invertColor: false,
        },
        {
            category: "Outcomes",
            metric: "Reperfusion Prob.",
            baseline: baselineOutcomes.reperfusionProbability,
            current: currentOutcomes.reperfusionProbability,
            unit: "%",
            icon: <TrendingUp className="w-4 h-4 text-neuro-text-secondary" />,
            invertColor: false,
        },
        {
            category: "Outcomes",
            metric: "Functional Indep. (mRS 0-2)",
            baseline: baselineOutcomes.mrs0to2Probability,
            current: currentOutcomes.mrs0to2Probability,
            unit: "%",
            icon: <Activity className="w-4 h-4 text-neuro-salvaged" />,
            invertColor: false,
        },
        {
            category: "Outcomes",
            metric: "sICH Risk",
            baseline: baselineOutcomes.sichRisk,
            current: currentOutcomes.sichRisk,
            unit: "%",
            icon: <AlertTriangle className="w-4 h-4 text-neuro-penumbra" />,
            invertColor: true,
        },
        {
            category: "Outcomes",
            metric: "Mortality Risk",
            baseline: baselineOutcomes.mortalityRisk,
            current: currentOutcomes.mortalityRisk,
            unit: "%",
            icon: <Skull className="w-4 h-4 text-neuro-text-primary" />,
            invertColor: true,
        },
    ];

    return (
        <div className={cn("glass-panel overflow-hidden", className)}>
            {/* Header with Toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neuro-border-subtle bg-neuro-bg-tertiary/30">
                <h3 className="text-sm font-semibold text-neuro-text-primary flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neuro-salvaged" />
                    Outcome Analysis
                </h3>

                <div className="flex bg-neuro-bg-tertiary rounded-lg p-0.5 border border-neuro-border-subtle">
                    <button
                        onClick={() => setViewMode("visual")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            viewMode === "visual"
                                ? "bg-neuro-bg-primary text-neuro-text-primary shadow-sm"
                                : "text-neuro-text-secondary hover:text-neuro-text-primary"
                        )}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Visual
                    </button>
                    <button
                        onClick={() => setViewMode("numerical")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            viewMode === "numerical"
                                ? "bg-neuro-bg-primary text-neuro-text-primary shadow-sm"
                                : "text-neuro-text-secondary hover:text-neuro-text-primary"
                        )}
                    >
                        <TableIcon className="w-3.5 h-3.5" />
                        Numerical
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-0">
                {viewMode === "visual" ? (
                    <div className={cn("grid gap-4 p-4", isCompact ? "grid-cols-[1.2fr_2fr]" : "grid-cols-1 md:grid-cols-[1fr_2fr]")}>
                        {/* Start: Tissue Fate Chart */}
                        <TissueFateDonut
                            data={tissueData}
                            isCompact={isCompact}
                            className="bg-transparent border-0 shadow-none p-0"
                        />

                        {/* Start: Outcome Comparison Chart */}
                        <OutcomeComparison
                            data={outcomeData}
                            uncertaintyData={uncertaintyData}
                            simulationMode={simulationMode}
                            simulationSource={simulationSource}
                            isCompact={isCompact}
                            className="bg-transparent border-0 shadow-none p-0"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neuro-bg-tertiary/50 border-b border-neuro-border-subtle">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-neuro-text-tertiary uppercase text-xs">Metric</th>
                                    <th className="px-4 py-3 font-semibold text-neuro-text-tertiary uppercase text-xs text-right">Baseline</th>
                                    <th className="px-4 py-3 font-semibold text-neuro-text-tertiary uppercase text-xs text-right">Current</th>
                                    <th className="px-4 py-3 font-semibold text-neuro-text-tertiary uppercase text-xs text-right">Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neuro-border-subtle">
                                {tableRows.map((row, idx) => {
                                    const change = getChange(row.current, row.baseline);
                                    const isPositive = change.value > 0;
                                    const isZero = change.value === 0;

                                    // Determine color based on desirability
                                    // invertColor = true means LESS is better (e.g. Mortality)
                                    // So if change > 0 (increase) and invertColor is true -> BAD (red)
                                    let valueColor = "text-neuro-text-tertiary";
                                    if (!isZero) {
                                        if (row.invertColor) {
                                            valueColor = isPositive ? "text-neuro-negative" : "text-neuro-positive";
                                        } else {
                                            valueColor = isPositive ? "text-neuro-positive" : "text-neuro-negative";
                                        }
                                    }

                                    return (
                                        <tr key={idx} className="hover:bg-neuro-bg-tertiary/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-md bg-neuro-bg-tertiary text-neuro-text-secondary">
                                                        {row.icon}
                                                    </div>
                                                    <span className="font-medium text-neuro-text-primary">{row.metric}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-neuro-text-secondary tabular-nums">
                                                {row.baseline.toFixed(1)} <span className="text-xs text-neuro-text-tertiary">{row.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-neuro-text-primary tabular-nums">
                                                {row.current.toFixed(1)} <span className="text-xs text-neuro-text-tertiary">{row.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                    !isZero && (valueColor === "text-neuro-positive" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"),
                                                    isZero && "bg-neuro-bg-tertiary text-neuro-text-tertiary"
                                                )}>
                                                    {isPositive ? "+" : ""}{change.value.toFixed(1)} {row.unit}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
