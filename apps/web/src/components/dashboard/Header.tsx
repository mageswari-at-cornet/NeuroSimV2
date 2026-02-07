import { useDashboardStore } from "../../store/dashboardStore";
import { cn } from "../../lib/utils";
import { Brain, Clock, User, Activity, Sun, Moon, ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface HeaderProps {
  className?: string;
  onBackToDashboard?: () => void;
}

export function Header({ className, onBackToDashboard }: HeaderProps) {
  const { patientData } = useDashboardStore();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse onset time from store and calculate elapsed time
  const { timeSinceOnset, isTimeCritical } = useMemo(() => {
    const onsetStr = patientData.onsetTime;

    // Handle "wake-up" stroke (unknown onset)
    if (onsetStr === "wake-up" || onsetStr.toLowerCase().includes("wake")) {
      return { timeSinceOnset: "Unknown", isTimeCritical: true };
    }

    // Try to parse time strings like "2h 14m ago" or "3h 30m ago"
    const hoursMatch = onsetStr.match(/(\d+)\s*h/i);
    const minsMatch = onsetStr.match(/(\d+)\s*m/i);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;

    const totalMinutes = hours * 60 + mins;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = Math.floor((currentTime / 1000) % 60); // Add seconds for live update

    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // Time critical if > 4.5 hours (270 min) for IVT window, or > 6 hours for EVT
    const critical = totalMinutes > 270;

    return { timeSinceOnset: formatted, isTimeCritical: critical };
  }, [patientData.onsetTime, currentTime]);

  const getRiskLevel = (value: number, threshold: number) => {
    if (value >= threshold) return "critical";
    if (value >= threshold * 0.7) return "warning";
    return "neutral";
  };

  return (
    <header
      className={cn(
        "min-h-[80px] px-6 py-3 flex items-center justify-between border-b border-neuro-border-subtle bg-neuro-bg-secondary/80 backdrop-blur-glass",
        className
      )}
    >
      {/* Left: Back Button + Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="p-2 text-neuro-text-secondary hover:text-neuro-text-primary rounded-lg hover:bg-neuro-bg-tertiary transition-colors"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-salvaged/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-neuro-salvaged" />
          </div>
          <span className="text-lg font-bold text-neuro-text-primary">
            NeuroSim
          </span>
        </div>

        <div className="h-8 w-px bg-neuro-border-subtle mx-2" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-neuro-text-tertiary">Patient ID:</span>
          <span className="text-sm font-semibold text-neuro-text-primary tabular-nums">
            #NS-2026-0042
          </span>
        </div>
      </div>

      {/* Center: Patient Phenotype Details - Neat Grid Layout */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Line 1: Demographics + Core + Collaterals + NIHSS + Time */}
        <div className="flex items-center justify-center gap-6 mb-2">
          {/* Demographics Group */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-neuro-bg-tertiary/50">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neuro-text-tertiary" />
              <span className="text-xs text-neuro-text-secondary">Age</span>
              <span className="text-sm font-semibold text-neuro-text-primary">{patientData.age}</span>
            </div>
            <div className="h-3 w-px bg-neuro-border-subtle" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neuro-text-secondary">Sex</span>
              <span className="text-sm font-semibold text-neuro-text-primary">{patientData.sex}</span>
            </div>
          </div>

          {/* Core Volume */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neuro-bg-tertiary/50">
            <Activity className="w-3.5 h-3.5 text-neuro-text-tertiary" />
            <span className="text-xs text-neuro-text-secondary">Core</span>
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              getRiskLevel(patientData.initialCoreVolume, 70) === "critical" ? "text-neuro-core" : "text-neuro-text-primary"
            )}>
              {patientData.initialCoreVolume}cc
            </span>
          </div>

          {/* Collaterals */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neuro-bg-tertiary/50">
            <span className="text-xs text-neuro-text-secondary">Collaterals</span>
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              patientData.collateralScore < 2 ? "text-neuro-penumbra" : "text-neuro-text-primary"
            )}>
              {patientData.collateralScore}
            </span>
          </div>

          {/* NIHSS Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neuro-bg-tertiary/50">
            <span className="text-xs text-neuro-text-secondary">NIHSS</span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                patientData.nihss >= 15
                  ? "text-neuro-core"
                  : patientData.nihss >= 8
                    ? "text-neuro-penumbra"
                    : "text-neuro-salvaged"
              )}
            >
              {patientData.nihss}
            </span>
            {patientData.nihss >= 15 && (
              <span className="text-[10px] text-neuro-core font-medium uppercase">Severe</span>
            )}
          </div>

          {/* Time Since Onset */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neuro-bg-tertiary/50">
            <Clock
              className={cn(
                "w-3.5 h-3.5",
                isTimeCritical ? "text-neuro-penumbra" : "text-neuro-text-secondary"
              )}
            />
            <span className="text-xs text-neuro-text-secondary">Time</span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isTimeCritical ? "text-neuro-penumbra" : "text-neuro-text-primary"
              )}
            >
              {timeSinceOnset}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Light/Dark Mode Toggle */}


        <div className="h-8 w-8 rounded-full bg-neuro-salvaged/20 flex items-center justify-center ml-2">
          <span className="text-sm font-semibold text-neuro-salvaged">DR</span>
        </div>
      </div>
    </header>
  );
}
