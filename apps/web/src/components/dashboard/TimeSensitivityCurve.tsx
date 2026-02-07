import { useMemo, useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { Clock, TrendingDown, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface TimeSensitivityPoint {
    time: number;
    mrs0to2: number;
    label: string;
    isCurrent: boolean;
}

interface TimeSensitivityCurveProps {
    currentTime: number; // Current time-to-reperfusion in minutes
    sensitivityData: TimeSensitivityPoint[];
    className?: string;
}

export function TimeSensitivityCurve({ currentTime, sensitivityData, className }: TimeSensitivityCurveProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Determine time window zones
    const getTimeZone = (time: number) => {
        if (time <= 240) return "optimal"; // < 4 hours
        if (time <= 360) return "extended"; // 4-6 hours
        return "late"; // > 6 hours
    };

    const currentZone = getTimeZone(currentTime);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        const data = payload[0].payload;
        return (
            <div className="glass-panel p-3 border border-neuro-border-subtle">
                <p className="text-xs text-neuro-text-secondary mb-1">{data.label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-neuro-salvaged">{data.mrs0to2}%</span>
                    <span className="text-xs text-neuro-text-tertiary">mRS 0-2</span>
                </div>
                {data.isCurrent && (
                    <p className="text-[10px] text-neuro-penumbra mt-1">← Current Time</p>
                )}
            </div>
        );
    };

    // Calculate outcome loss per hour of delay
    const outcomeLossPerHour = useMemo(() => {
        if (sensitivityData.length < 2) return 0;
        const first = sensitivityData[0];
        const last = sensitivityData[sensitivityData.length - 1];
        const timeDiff = (last.time - first.time) / 60; // hours
        const outcomeDiff = first.mrs0to2 - last.mrs0to2; // percentage points
        return timeDiff > 0 ? (outcomeDiff / timeDiff).toFixed(1) : 0;
    }, [sensitivityData]);

    return (
        <div className={cn("glass-panel", className)}>
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 hover:bg-neuro-bg-tertiary/30 transition-colors rounded-t-xl"
            >
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-neuro-penumbra mt-0.5" />
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-neuro-text-primary mb-1 flex items-center gap-2">
                            Time Sensitivity Analysis
                        </h3>
                        <p className="text-xs text-neuro-text-tertiary">
                            Impact of treatment delays on functional independence
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Outcome Loss Rate */}
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-neuro-core">
                            <TrendingDown className="w-3 h-3" />
                            <span className="text-xs font-medium">{outcomeLossPerHour}% / hour</span>
                        </div>
                        <p className="text-[10px] text-neuro-text-tertiary">Outcome loss rate</p>
                    </div>

                    {/* Expand/Collapse Icon */}
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
                <div className="px-5 pb-5">{/* Time Zone Indicator */}
                    <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-neuro-bg-tertiary/50">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            currentZone === "optimal" && "bg-neuro-salvaged",
                            currentZone === "extended" && "bg-neuro-penumbra",
                            currentZone === "late" && "bg-neuro-core"
                        )} />
                        <span className="text-xs text-neuro-text-secondary">
                            Current time ({currentTime} min) is in the{" "}
                            <span className={cn(
                                "font-semibold",
                                currentZone === "optimal" && "text-neuro-salvaged",
                                currentZone === "extended" && "text-neuro-penumbra",
                                currentZone === "late" && "text-neuro-core"
                            )}>
                                {currentZone === "optimal" && "optimal window"}
                                {currentZone === "extended" && "extended window"}
                                {currentZone === "late" && "late window"}
                            </span>
                        </span>
                    </div>

                    {/* Chart */}
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sensitivityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="mrs0to2Gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />

                                <XAxis
                                    dataKey="time"
                                    stroke="#64748b"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(val) => `${val}m`}
                                    label={{ value: 'Time to Reperfusion (min)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }}
                                />

                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(val) => `${val}%`}
                                    domain={[0, 100]}
                                    label={{ value: 'mRS 0-2 (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, offset: 10 }}
                                />

                                {/* Time zone backgrounds */}
                                <ReferenceLine
                                    x={240}
                                    stroke="#22c55e"
                                    strokeDasharray="3 3"
                                    strokeOpacity={0.3}
                                    label={{ value: '4hr', position: 'top', fill: '#22c55e', fontSize: 10 }}
                                />
                                <ReferenceLine
                                    x={360}
                                    stroke="#f59e0b"
                                    strokeDasharray="3 3"
                                    strokeOpacity={0.3}
                                    label={{ value: '6hr', position: 'top', fill: '#f59e0b', fontSize: 10 }}
                                />

                                {/* Current time marker */}
                                <ReferenceLine
                                    x={currentTime}
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    label={{
                                        value: 'Current',
                                        position: 'top',
                                        fill: '#06b6d4',
                                        fontSize: 10,
                                        fontWeight: 600
                                    }}
                                />

                                <Tooltip content={<CustomTooltip />} />

                                <Area
                                    type="monotone"
                                    dataKey="mrs0to2"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fill="url(#mrs0to2Gradient)"
                                    dot={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={payload.isCurrent ? 5 : 3}
                                                fill={payload.isCurrent ? "#06b6d4" : "#22c55e"}
                                                stroke={payload.isCurrent ? "#0891b2" : "#16a34a"}
                                                strokeWidth={2}
                                            />
                                        );
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neuro-border-subtle">
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-neuro-salvaged" />
                                <span className="text-neuro-text-tertiary">{'<'} 4hr (Optimal)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-neuro-penumbra" />
                                <span className="text-neuro-text-tertiary">4-6hr (Extended)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-neuro-core" />
                                <span className="text-neuro-text-tertiary">{'>'} 6hr (Late)</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-neuro-salvaged" />
                            <span className="text-xs text-neuro-text-tertiary">mRS 0-2 Probability</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
