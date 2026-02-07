import { useDashboardStore } from "../../store/dashboardStore";
import { ScenarioRadioGroup } from "../ui/ScenarioRadioGroup";
import { InterventionSlider } from "../ui/InterventionSlider";
import { cn } from "../../lib/utils";
import {
  Activity,
  Target,
  Sparkles,
} from "lucide-react";

interface ScenarioControlsProps {
  className?: string;
}

export function ScenarioControls({ className }: ScenarioControlsProps) {
  const {
    activeScenario,
    simulationParams,
    updateSimulationParams,
    patientData,
    simulationMode,
    setSimulationMode,
  } = useDashboardStore();

  const getScenarioTitle = () => {
    switch (activeScenario) {
      case "routing":
        return "Patient Routing";
      case "bridging":
        return "Bridging Therapy";
      case "imaging":
        return "Imaging Pathway";
      case "tandem":
        return "Tandem Lesion";
      case "large-core":
        return "Large Core";
      case "wake-up":
        return "Wake-Up Stroke";
      default:
        return activeScenario;
    }
  };

  const renderScenarioControls = () => {
    switch (activeScenario) {
      case "routing":
        return (
          <div className="space-y-4">
            <ScenarioRadioGroup
              options={[
                {
                  value: "drip-and-ship",
                  label: "Drip-and-Ship",
                  description: "IVT locally, then transfer",
                },
                {
                  value: "direct-mothership",
                  label: "Direct Mothership",
                  description: "Direct to EVT center",
                },
              ]}
              value={simulationParams.routingStrategy}
              onChange={(v) =>
                updateSimulationParams({
                  routingStrategy: v as "drip-and-ship" | "direct-mothership",
                })
              }
            />
            <InterventionSlider
              label="Transfer Delay"
              value={simulationParams.transferDelay}
              min={0}
              max={120}
              step={5}
              unit="min"
              warning={
                simulationParams.transferDelay > 60 && patientData.collateralScore < 2
                  ? "Long delay with poor collaterals"
                  : undefined
              }
              onChange={(v) => updateSimulationParams({ transferDelay: v })}
            />
            <InterventionSlider
              label="Door-to-Groin Time"
              value={simulationParams.doorToGroinTime}
              min={25}
              max={120}
              step={5}
              unit="min"
              onChange={(v) => updateSimulationParams({ doorToGroinTime: v })}
            />
          </div>
        );

      case "bridging":
        return (
          <div className="space-y-4">
            <ScenarioRadioGroup
              options={[
                {
                  value: "evt-alone",
                  label: "EVT Alone",
                  description: "Direct thrombectomy",
                },
                {
                  value: "bridging",
                  label: "Bridging",
                  description: "IVT + EVT",
                },
              ]}
              value={simulationParams.treatmentStrategy}
              onChange={(v) =>
                updateSimulationParams({
                  treatmentStrategy: v as "evt-alone" | "bridging",
                })
              }
            />
            {simulationParams.treatmentStrategy === "bridging" && (
              <InterventionSlider
                label="IVT Workflow Delay"
                value={simulationParams.ivtWorkflowDelay}
                min={0}
                max={20}
                step={1}
                unit="min"
                warning={
                  patientData.initialCoreVolume > 70
                    ? "Large core: higher hemorrhage risk"
                    : undefined
                }
                onChange={(v) => updateSimulationParams({ ivtWorkflowDelay: v })}
              />
            )}
          </div>
        );

      case "imaging":
        return (
          <div className="space-y-4">
            <ScenarioRadioGroup
              options={[
                {
                  value: "standard",
                  label: "Standard",
                  description: "CTA + Perfusion (~35min)",
                },
                {
                  value: "direct-to-angio",
                  label: "Direct-to-Angio",
                  description: "Skip perfusion",
                },
              ]}
              value={simulationParams.imagingPathway}
              onChange={(v) =>
                updateSimulationParams({
                  imagingPathway: v as "standard" | "direct-to-angio",
                })
              }
            />
            {simulationParams.imagingPathway === "standard" &&
              patientData.collateralScore < 2 && (
                <div className="p-2 rounded bg-neuro-penumbra/10 border border-neuro-penumbra/20">
                  <p className="text-xs text-neuro-penumbra">
                    Poor collaterals: consider direct-to-angio
                  </p>
                </div>
              )}
          </div>
        );

      case "tandem":
        return (
          <div className="space-y-4">
            <ScenarioRadioGroup
              options={[
                {
                  value: "balloon-only",
                  label: "Balloon Only",
                  description: "Temporary angioplasty",
                },
                {
                  value: "acute-stenting",
                  label: "Stenting + DAPT",
                  description: "Higher bleed risk",
                },
              ]}
              value={simulationParams.tandemApproach}
              onChange={(v) =>
                updateSimulationParams({
                  tandemApproach: v as "balloon-only" | "acute-stenting",
                })
              }
            />
            {simulationParams.tandemApproach === "acute-stenting" && (
              <div className="p-2 rounded bg-neuro-penumbra/10 border border-neuro-penumbra/20">
                <p className="text-xs text-neuro-penumbra">
                  DAPT increases hemorrhage risk
                </p>
              </div>
            )}
          </div>
        );

      case "large-core":
        return (
          <div className="space-y-4">
            <div className="p-2 rounded bg-neuro-core/10 border border-neuro-core/20">
              <p className="text-xs text-neuro-core">
                <strong>Core:</strong> {patientData.initialCoreVolume}cc ({'>'} 70cc threshold)
              </p>
            </div>
            <ScenarioRadioGroup
              options={[
                {
                  value: "medical",
                  label: "Medical",
                  description: "Conservative treatment",
                },
                {
                  value: "thrombectomy",
                  label: "Thrombectomy",
                  description: "Mechanical retrieval",
                },
              ]}
              value={simulationParams.largeCoreStrategy}
              onChange={(v) =>
                updateSimulationParams({
                  largeCoreStrategy: v as "medical" | "thrombectomy",
                })
              }
            />
          </div>
        );

      case "wake-up":
        return (
          <div className="space-y-4">
            <ScenarioRadioGroup
              options={[
                { value: "mild", label: "Mild Mismatch", description: "Small salvage" },
                { value: "moderate", label: "Moderate Mismatch", description: "Moderate penumbra" },
                { value: "strong", label: "Strong Mismatch", description: "Large salvage" },
              ]}
              value={simulationParams.mismatchStrength}
              onChange={(v) =>
                updateSimulationParams({
                  mismatchStrength: v as "mild" | "moderate" | "strong",
                })
              }
            />
            <ScenarioRadioGroup
              options={[
                {
                  value: "evt-alone",
                  label: "EVT Alone",
                  description: "No thrombolysis",
                },
                {
                  value: "ivt-plus-evt",
                  label: "IVT + EVT",
                  description: "Mismatch-guided",
                },
              ]}
              value={simulationParams.wakeUpStrategy}
              onChange={(v) =>
                updateSimulationParams({
                  wakeUpStrategy: v as "evt-alone" | "ivt-plus-evt",
                })
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Active Scenario Header */}
      <div className="pb-3 border-b border-neuro-border-subtle">
        <h3 className="text-lg font-bold text-neuro-text-primary flex items-center gap-2">
          <Activity className="w-5 h-5 text-neuro-salvaged" />
          {getScenarioTitle()}
        </h3>
      </div>

      {/* Simulation Mode Toggle - Compact */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-neuro-text-tertiary font-medium mb-2 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          Mode
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setSimulationMode("deterministic")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all",
              simulationMode === "deterministic"
                ? "bg-neuro-salvaged/20 text-neuro-salvaged border border-neuro-salvaged/30"
                : "text-neuro-text-secondary hover:text-neuro-text-primary bg-neuro-bg-tertiary/50"
            )}
          >
            <Target className="w-3 h-3" />
            <span>Deterministic</span>
          </button>
          <button
            onClick={() => setSimulationMode("monte-carlo")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all",
              simulationMode === "monte-carlo"
                ? "bg-neuro-salvaged/20 text-neuro-salvaged border border-neuro-salvaged/30"
                : "text-neuro-text-secondary hover:text-neuro-text-primary bg-neuro-bg-tertiary/50"
            )}
          >
            <Sparkles className="w-3 h-3" />
            <span>Uncertainty</span>
          </button>
        </div>
        <p className="text-[10px] text-neuro-text-tertiary mt-1.5">
          {simulationMode === "deterministic"
            ? "Single-point estimates"
            : "Monte Carlo (200 runs)"}
        </p>
      </div>

      {/* Scenario-specific controls */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-neuro-text-tertiary font-medium mb-3">
          Controls
        </h4>
        {renderScenarioControls()}
      </div>

      {/* Shared physiology controls - Compact */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-neuro-text-tertiary font-medium mb-3">
          Physiology
        </h4>
        <InterventionSlider
          label="SBP Target"
          value={simulationParams.sbpTarget}
          min={100}
          max={200}
          step={5}
          unit="mmHg"
          warning={
            simulationParams.sbpTarget < 120 && patientData.collateralScore < 2
              ? "Low SBP + poor collaterals"
              : simulationParams.sbpTarget > 180
                ? "High SBP: bleed risk"
                : undefined
          }
          onChange={(v) => updateSimulationParams({ sbpTarget: v })}
        />
      </div>
    </div>
  );
}
