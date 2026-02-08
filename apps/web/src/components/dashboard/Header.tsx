import { useDashboardStore } from "../../store/dashboardStore";
import { cn } from "../../lib/utils";
import { Brain, User, Activity, ArrowLeft, MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  className?: string;
  onBackToDashboard?: () => void;
  isChatOpen?: boolean;
  onChatToggle?: () => void;
}

export function Header({ className, onBackToDashboard, isChatOpen = false, onChatToggle }: HeaderProps) {
  const { patientData } = useDashboardStore();
  const [isDarkMode] = useState(true);

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
        {/* Line 1: Demographics + Core + Collaterals + NIHSS */}
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
