import { useDashboardStore } from "../../store/dashboardStore";
import { RiskGauge } from "../ui/RiskGauge";
import { cn } from "../../lib/utils";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface PatientPanelProps {
  className?: string;
}

export function PatientPanel({ className }: PatientPanelProps) {
  const { patientData, activeScenario, currentOutcomes } = useDashboardStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse onset time from store and calculate elapsed time
  const { timeSinceOnset } = useMemo(() => {
    const onsetStr = patientData.onsetTime;

    // Handle "wake-up" stroke (unknown onset)
    if (onsetStr === "wake-up" || onsetStr.toLowerCase().includes("wake")) {
      return { timeSinceOnset: "Unknown" };
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
    return { timeSinceOnset: formatted };
  }, [patientData.onsetTime, currentTime]);

  const getScenarioWarning = () => {
    switch (activeScenario) {
      case "large-core":
        return patientData.initialCoreVolume > 70
          ? "Large core phenotype: Reduced salvage potential, increased hemorrhage risk"
          : null;
      case "routing":
        return patientData.collateralScore < 2
          ? "Poor collaterals: Time-sensitive, minimize delays"
          : null;
      default:
        return null;
    }
  };

  const scenarioWarning = getScenarioWarning();

  // Dynamic risk modifiers - EXACT LOGIC FROM app.py (lines 640-675)
  // Core Growth Speed: Based on collaterals and core delta (from Python app.py)
  const getCoreGrowthSpeed = () => {
    const coll = patientData.collateralScore;
    const coreInitial = patientData.initialCoreVolume;
    const coreFinal = currentOutcomes.finalCoreVolume;
    const deltaCore = coreFinal - coreInitial;

    let coreSpeed = 1;
    coreSpeed += coll < 1.5 ? 2 : (coll < 2.2 ? 1 : 0);
    coreSpeed += deltaCore > 25 ? 1 : 0;
    coreSpeed += deltaCore > 45 ? 1 : 0;

    return Math.max(1, Math.min(5, coreSpeed));
  };

  // Reperfusion Difficulty: Based on occlusion type and current reperfusion probability
  const getReperfusionDifficulty = () => {
    const occl = patientData.occlusionLocation.toLowerCase();
    let baseScore = 3;
    if (occl.includes('tandem') || occl.includes('+')) baseScore = 5;
    else if (occl.includes('ica-t') || occl.includes('terminus')) baseScore = 4;
    else if (occl.includes('m2')) baseScore = 2;
    else if (occl.includes('m1')) baseScore = 3;

    // Adjust based on current reperfusion probability
    if (currentOutcomes.reperfusionProbability > 85) baseScore = Math.max(1, baseScore - 1);
    if (currentOutcomes.reperfusionProbability < 70) baseScore = Math.min(5, baseScore + 1);

    return baseScore;
  };

  // Hemorrhage Vulnerability: EXACT LOGIC FROM app.py (lines 659-669)
  const getHemorrhageVulnerability = () => {
    const sich = currentOutcomes.sichRisk;
    const coreFinal = currentOutcomes.finalCoreVolume;
    const sbp = patientData.systolicBP;

    let hv = 1;
    if (sich > 10) hv += 1;
    if (sich > 18) hv += 1;
    if (coreFinal > 60) hv += 1;
    if (sbp > 170) hv += 1;

    return Math.max(1, Math.min(5, hv));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Clinical Parameters - Now First */}
      <div>
        <h3 className="text-sm font-semibold text-neuro-text-primary mb-3">
          Clinical Parameters
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-neuro-text-tertiary block text-xs">Occlusion</span>
            <span className="text-neuro-text-primary font-medium">{patientData.occlusionLocation}</span>
          </div>
          <div>
            <span className="text-neuro-text-tertiary block text-xs">Territory at Risk</span>
            <span className="text-neuro-text-primary font-medium">{patientData.territoryAtRisk} cc</span>
          </div>
          <div>
            <span className="text-neuro-text-tertiary block text-xs">Systolic BP</span>
            <span className="text-neuro-text-primary font-medium">{patientData.systolicBP} mmHg</span>
          </div>
          <div>
            <span className="text-neuro-text-tertiary block text-xs">Onset</span>
            <span className="text-neuro-text-primary font-bold tabular-nums">{timeSinceOnset}</span>
          </div>
        </div>
      </div>

      {/* Scenario-specific warning */}
      {scenarioWarning && (
        <div className="p-3 rounded-lg bg-neuro-penumbra/10 border border-neuro-penumbra/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-neuro-penumbra flex-shrink-0 mt-0.5" />
          <p className="text-xs text-neuro-penumbra">{scenarioWarning}</p>
        </div>
      )}

      {/* Risk Modifiers - Now Dynamic */}
      <div className="pt-4 border-t border-neuro-border-subtle">
        <h3 className="text-sm font-semibold text-neuro-text-primary mb-3">
          Risk Modifiers
        </h3>
        <div className="space-y-4">
          <RiskGauge
            label="Core Growth Speed"
            value={getCoreGrowthSpeed()}
            max={5}
          />
          <RiskGauge
            label="Reperfusion Difficulty"
            value={getReperfusionDifficulty()}
            max={5}
          />
          <RiskGauge
            label="Hemorrhage Vulnerability"
            value={getHemorrhageVulnerability()}
            max={5}
          />
        </div>
      </div>
    </div>
  );
}
