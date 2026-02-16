import { useDashboardStore } from "../../store/dashboardStore";
import { cn } from "../../lib/utils";
import { Brain, User, Activity, ArrowLeft, MessageCircle, X, Clock, HeartPulse, LocateFixed } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface HeaderProps {
  className?: string;
  onBackToDashboard?: () => void;
  isChatOpen?: boolean;
  onChatToggle?: () => void;
}

export function Header({ className, onBackToDashboard, isChatOpen = false, onChatToggle }: HeaderProps) {
  const { patientData } = useDashboardStore();
  const [isDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse onset time from store and calculate elapsed time
  const timeSinceOnset = useMemo(() => {
    const onsetStr = patientData.onsetTime;

    // Handle "wake-up" stroke (unknown onset)
    if (onsetStr === "wake-up" || onsetStr.toLowerCase().includes("wake")) {
      return "Unknown";
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

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [patientData.onsetTime, currentTime]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const getRiskLevel = (value: number, threshold: number) => {
    if (value >= threshold) return "critical";
    if (value >= threshold * 0.7) return "warning";
    return "neutral";
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 min-h-[80px] px-6 py-3 flex items-center justify-between border-b border-neuro-border-subtle bg-neuro-bg-secondary/95 backdrop-blur-glass",
        className
      )}
    >
      {/* Left: Back Button + Logo */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="p-1.5 text-neuro-text-secondary hover:text-neuro-text-primary rounded-lg hover:bg-neuro-bg-tertiary transition-colors"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div
          className={cn(
            "flex flex-col gap-0.5",
            onBackToDashboard && "cursor-pointer hover:opacity-80"
          )}
          onClick={onBackToDashboard}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-neuro-salvaged/20 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-neuro-salvaged" />
            </div>
            <span className="text-base font-bold text-neuro-text-primary leading-none">
              NeuroSim
            </span>
          </div>

          <div className="flex items-center gap-1 pl-[26px]">
            <span className="text-[9px] text-neuro-text-tertiary">ID:</span>
            <span className="text-[9px] font-mono text-neuro-text-secondary tabular-nums">
              #NS-2026-0042
            </span>
          </div>
        </div>
      </div>

      {/* Center: Patient Phenotype Details - Neat Grid Layout */}
      <div className="flex-1 flex flex-col justify-center px-4 min-w-0">
        {/* Line 1: Demographics + Core + Collaterals + NIHSS */}
        {/* Line 1: Demographics + Core + Collaterals + NIHSS */}
        <div className="flex items-center justify-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-hide w-full">
          {/* Demographics Group */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
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
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
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
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
            <span className="text-xs text-neuro-text-secondary">Collaterals</span>
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              patientData.collateralScore < 2 ? "text-neuro-penumbra" : "text-neuro-text-primary"
            )}>
              {patientData.collateralScore}
            </span>
          </div>

          {/* NIHSS Score */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
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

          <div className="h-8 w-px bg-neuro-border-subtle mx-1 flex-shrink-0" />

          {/* Occlusion */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
            <LocateFixed className="w-3.5 h-3.5 text-neuro-text-tertiary flex-shrink-0" />
            <span className="text-xs text-neuro-text-secondary">Occlusion</span>
            <span className="text-sm font-semibold text-neuro-text-primary">{patientData.occlusionLocation}</span>
          </div>

          {/* Systolic BP */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
            <HeartPulse className="w-3.5 h-3.5 text-neuro-text-tertiary flex-shrink-0" />
            <span className="text-xs text-neuro-text-secondary">BP</span>
            <span className="text-sm font-semibold text-neuro-text-primary tabular-nums">{patientData.systolicBP} mmHg</span>
          </div>

          {/* Time Since Onset */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neuro-bg-tertiary/50 whitespace-nowrap flex-shrink-0">
            <Clock className="w-3.5 h-3.5 text-neuro-text-tertiary flex-shrink-0" />
            <span className="text-xs text-neuro-text-secondary">Onset</span>
            <span className="text-sm font-bold text-neuro-text-primary tabular-nums">{timeSinceOnset}</span>
          </div>
        </div>
      </div>

      {/* Right: Chat Button */}
      {onChatToggle && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onChatToggle}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              isChatOpen
                ? "bg-neuro-salvaged text-white"
                : "text-neuro-text-primary hover:bg-neuro-bg-tertiary/80"
            )}
            aria-label={isChatOpen ? "Close chat" : "Open chat"}
          >
            {isChatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">Chat</span>
          </button>
        </div>
      )}
    </header>
  );
}
