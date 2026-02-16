import { useDashboardStore } from "../../store/dashboardStore";
import { RiskGauge } from "../ui/RiskGauge";
import { cn } from "../../lib/utils";
import { AlertTriangle } from "lucide-react";


interface PatientPanelProps {
  className?: string;
}

export function PatientPanel({ className }: PatientPanelProps) {
  const { patientData, activeScenario, currentOutcomes } = useDashboardStore();





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


      {/* Scenario-specific warning */}
      {scenarioWarning && (
        <div className="p-3 rounded-lg bg-neuro-penumbra/10 border border-neuro-penumbra/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-neuro-penumbra flex-shrink-0 mt-0.5" />
          <p className="text-xs text-neuro-penumbra">{scenarioWarning}</p>
        </div>
      )}

      {/* Risk Modifiers - Now Dynamic */}
      <div className="pt-0 border-t-0">
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
