import { useState } from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import { cn } from "../../lib/utils";
import { ChevronDown, Network } from "lucide-react";

interface CausalDAGProps {
  className?: string;
}

export function CausalDAG({ className }: CausalDAGProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeScenario, simulationParams, currentOutcomes, baselineOutcomes } = useDashboardStore();

  // Calculate deltas dynamically from store
  const timeDelta = currentOutcomes.timeToReperfusion - baselineOutcomes.timeToReperfusion;
  const coreDelta = currentOutcomes.finalCoreVolume - baselineOutcomes.finalCoreVolume;
  const reperfDelta = currentOutcomes.reperfusionProbability - baselineOutcomes.reperfusionProbability;
  const sichDelta = currentOutcomes.sichRisk - baselineOutcomes.sichRisk;
  const mrsDelta = currentOutcomes.mrs0to2Probability - baselineOutcomes.mrs0to2Probability;
  const mortalityDelta = currentOutcomes.mortalityRisk - baselineOutcomes.mortalityRisk;
  const salvageDelta = currentOutcomes.penumbraSalvaged - baselineOutcomes.penumbraSalvaged;

  // Helper to format delta
  const formatDelta = (delta: number, unit: string = "%", invert: boolean = false) => {
    const effectiveDelta = invert ? -delta : delta;
    const isPositive = effectiveDelta > 0;
    const colorClass = delta === 0
      ? "text-neuro-text-tertiary"
      : isPositive
        ? "text-neuro-positive"
        : "text-neuro-negative";
    const sign = delta > 0 ? "+" : "";
    return <span className={colorClass}>{sign}{delta}{unit}</span>;
  };

  const getScenarioNarrative = () => {
    switch (activeScenario) {
      case "routing":
        return simulationParams.routingStrategy === "drip-and-ship"
          ? "Drip-and-ship provides early IVT but adds transfer time. The benefit depends on collateral status and transfer delay."
          : "Direct mothership minimizes time-to-EVT but misses potential early recanalization from IVT.";
      case "bridging":
        return simulationParams.treatmentStrategy === "bridging"
          ? "Bridging increases early recanalization probability by 15% but adds 8-minute workflow delay and increases sICH risk."
          : "EVT alone avoids IVT-related delays and bleeding risks but misses potential early recanalization.";
      case "imaging":
        return simulationParams.imagingPathway === "standard"
          ? "Standard imaging provides complete assessment but adds ~35 minutes. Best when collaterals are good."
          : "Direct-to-angio saves 35 minutes but may miss critical perfusion information.";
      case "tandem":
        return simulationParams.tandemApproach === "acute-stenting"
          ? "Acute stenting provides durable reperfusion but requires DAPT, increasing hemorrhage risk."
          : "Balloon-only avoids DAPT-related bleeding but carries higher re-occlusion risk.";
      case "large-core":
        return simulationParams.largeCoreStrategy === "thrombectomy"
          ? "Thrombectomy in large core reduces severe disability/death by 15% despite lower salvage potential."
          : "Medical management avoids procedure risks but has higher mortality in large core strokes.";
      case "wake-up":
        return simulationParams.wakeUpStrategy === "ivt-plus-evt"
          ? "Mismatch-guided thrombolysis can improve outcomes when MRI shows strong mismatch."
          : "EVT alone avoids thrombolysis uncertainty but may miss additional benefit from IVT.";
      default:
        return "";
    }
  };

  return (
    <div className={cn("glass-panel", className)}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-neuro-bg-tertiary/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-neuro-penumbra" />
          <h3 className="text-sm font-semibold text-neuro-text-primary">
            Causal Pathway
          </h3>
        </div>

        <ChevronDown
          className={cn(
            "w-5 h-5 text-neuro-text-secondary transition-transform",
            isExpanded && "transform rotate-180"
          )}
        />
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Mechanism Narrative */}
          <div className="p-3 rounded-lg bg-neuro-bg-tertiary/50 border border-neuro-border-subtle">
            <p className="text-xs text-neuro-text-secondary leading-relaxed">
              {getScenarioNarrative()}
            </p>
          </div>

          {/* Factor Contributions - Now Dynamic */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-neuro-text-tertiary uppercase tracking-wider">
              Factor Contributions
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Time to Reperfusion</span>
                {formatDelta(timeDelta, " min", true)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Core Growth</span>
                {formatDelta(coreDelta, " cc", true)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Penumbra Salvaged</span>
                {formatDelta(salvageDelta, " cc")}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Reperfusion Prob</span>
                {formatDelta(reperfDelta, "%")}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">sICH Risk</span>
                {formatDelta(sichDelta, "%", true)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Mortality</span>
                {formatDelta(mortalityDelta, "%", true)}
              </div>
              <div className="flex justify-between items-center border-t border-neuro-border-subtle pt-2 mt-2">
                <span className="text-neuro-text-primary font-medium">mRS 0-2</span>
                {formatDelta(mrsDelta, "%")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
