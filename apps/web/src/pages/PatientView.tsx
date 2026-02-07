import { useEffect, useMemo } from "react";
import { Header } from "../components/dashboard/Header";
import { ScenarioControls } from "../components/dashboard/ScenarioControls";
import { CausalChangeStrip } from "../components/dashboard/CausalChangeStrip";
import { ImagingViewer } from "../components/dashboard/ImagingViewer";
import { TissueFateDonut } from "../components/dashboard/TissueFateDonut";
import { OutcomeComparison } from "../components/dashboard/OutcomeComparison";
import { PatientPanel } from "../components/dashboard/PatientPanel";
import { CausalDAG } from "../components/dashboard/CausalDAG";
import { FamilyExplanation } from "../components/dashboard/FamilyExplanation";
import { TimeSensitivityCurve } from "../components/dashboard/TimeSensitivityCurve";
import { useDashboardStore } from "../store/dashboardStore";
import { Activity, Clock, Heart, AlertTriangle, Brain, TrendingUp, Skull } from "lucide-react";

interface PatientViewProps {
  patientId: string;
  onBackToDashboard: () => void;
}

export function PatientView({ patientId, onBackToDashboard }: PatientViewProps) {
  const { currentOutcomes, baselineOutcomes, activeScenario, simulationMode, uncertaintyOutcomes, baselineUncertainty, simulationParams, setSelectedPatient, getTimeSensitivity } = useDashboardStore();

  // Reactive sensitivity data - recalculates when outcomes change
  const sensitivityData = useMemo(() => {
    return getTimeSensitivity();
  }, [currentOutcomes.timeToReperfusion, simulationParams, getTimeSensitivity]);

  // Load patient data on mount
  useEffect(() => {
    setSelectedPatient(patientId);
  }, [patientId, setSelectedPatient]);

  // Calculate deltas for causal change strip
  const getActionText = () => {
    switch (activeScenario) {
      case "routing":
        return "Routing Strategy";
      case "bridging":
        return "Treatment Strategy";
      case "imaging":
        return "Imaging Pathway";
      case "tandem":
        return "Tandem Approach";
      case "large-core":
        return "Large Core Management";
      case "wake-up":
        return "Wake-Up Strategy";
      default:
        return "Intervention";
    }
  };

  const tissueFateData = {
    core: currentOutcomes.finalCoreVolume,
    salvaged: currentOutcomes.penumbraSalvaged,
    atRisk: currentOutcomes.penumbraAtRisk - currentOutcomes.penumbraSalvaged,
  };

  // Dynamic outcome data from store
  const outcomeData = [
    {
      metric: "mRS 0-2",
      baseline: baselineOutcomes.mrs0to2Probability,
      current: currentOutcomes.mrs0to2Probability,
      unit: "%",
    },
    {
      metric: "sICH Risk",
      baseline: baselineOutcomes.sichRisk,
      current: currentOutcomes.sichRisk,
      unit: "%",
    },
    {
      metric: "Mortality",
      baseline: baselineOutcomes.mortalityRisk,
      current: currentOutcomes.mortalityRisk,
      unit: "%",
    },
  ];

  // Dynamic key metrics from store (using baselineOutcomes and currentOutcomes)
  const keyMetricsBaseline = {
    timeToReperfusion: baselineOutcomes.timeToReperfusion,
    finalCoreVolume: baselineOutcomes.finalCoreVolume,
    penumbraSalvaged: baselineOutcomes.penumbraSalvaged,
    reperfusionProbability: baselineOutcomes.reperfusionProbability,
    sichRisk: baselineOutcomes.sichRisk,
    mortalityRisk: baselineOutcomes.mortalityRisk,
    mrs0to2Probability: baselineOutcomes.mrs0to2Probability,
  };

  const keyMetricsCurrent = {
    timeToReperfusion: currentOutcomes.timeToReperfusion,
    finalCoreVolume: currentOutcomes.finalCoreVolume,
    penumbraSalvaged: currentOutcomes.penumbraSalvaged,
    reperfusionProbability: currentOutcomes.reperfusionProbability,
    sichRisk: currentOutcomes.sichRisk,
    mortalityRisk: currentOutcomes.mortalityRisk,
    mrs0to2Probability: currentOutcomes.mrs0to2Probability,
  };

  const uncertaintyOutcomeData = [
    {
      metric: "mRS 0-2",
      baseline: baselineUncertainty.mrs0to2Probability,
      current: uncertaintyOutcomes.mrs0to2Probability,
      unit: "%",
    },
    {
      metric: "sICH Risk",
      baseline: baselineUncertainty.sichRisk,
      current: uncertaintyOutcomes.sichRisk,
      unit: "%",
    },
    {
      metric: "Mortality",
      baseline: baselineUncertainty.mortalityRisk,
      current: uncertaintyOutcomes.mortalityRisk,
      unit: "%",
    },
  ];

  return (
    <div className="min-h-screen bg-neuro-bg-primary flex flex-col">
      {/* Header - Now with patient phenotype */}
      <Header onBackToDashboard={onBackToDashboard} />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Scenario Controls - Further reduced width */}
        <aside className="w-64 flex-shrink-0 bg-neuro-bg-secondary/50 border-r border-neuro-border-subtle overflow-y-auto">
          <div className="p-4">
            <ScenarioControls />
          </div>
        </aside>

        {/* Main Content Area - Increased width */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Causal Change Summary Strip - Non-scrollable */}
          <div className="px-4 py-3 border-b border-neuro-border-subtle">
            <CausalChangeStrip
              change={{
                action: getActionText(),
                mediator: `Time-to-reperfusion (${currentOutcomes.timeToReperfusion} min)`,
                outcome: `mRS 0-2 ${currentOutcomes.mrs0to2Probability >= baselineOutcomes.mrs0to2Probability ? "↑" : "↓"} ${Math.abs(currentOutcomes.mrs0to2Probability - baselineOutcomes.mrs0to2Probability)}%`,
                outcomeDelta: currentOutcomes.mrs0to2Probability - baselineOutcomes.mrs0to2Probability,
              }}
            />
          </div>

          {/* Main Canvas - Reorganized Layout */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Row 1: Imaging - Full Width */}
              <div className="w-full">
                <ImagingViewer className="min-h-[180px]" />
              </div>

              {/* Row 2: Tissue Fate + Causal Pathway */}
              <div className="grid grid-cols-2 gap-4">
                <TissueFateDonut data={tissueFateData} />
                <OutcomeComparison
                  data={outcomeData}
                  uncertaintyData={uncertaintyOutcomeData}
                  simulationMode={simulationMode}
                />
              </div>

              {/* Row 3: Key Outcome Metrics - Table Style */}
              {/* Row 3: Time Sensitivity Curve (Always Expanded) */}
              <TimeSensitivityCurve
                currentTime={currentOutcomes.timeToReperfusion}
                sensitivityData={sensitivityData}
              />

              {/* Row 4: Causal Pathway */}
              <CausalDAG />
            </div>
          </div>
        </main>

        {/* Right Panel - Patient Info & Explanation */}
        <aside className="w-72 flex-shrink-0 bg-neuro-bg-secondary/50 border-l border-neuro-border-subtle overflow-y-auto">
          <div className="p-4 space-y-6">
            <PatientPanel />

            <div className="h-px bg-neuro-border-subtle" />

            {/* Key Outcome Metrics - Compact Sidebar Version */}
            <div className="glass-panel p-3 overflow-x-auto">
              <h3 className="text-sm font-semibold text-neuro-text-primary mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-neuro-salvaged" />
                Key Metrics
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neuro-bg-tertiary/50">
                    <th className="text-left py-1 px-1 font-medium text-neuro-text-tertiary uppercase">Metric</th>
                    <th className="text-center py-1 px-1 font-medium text-neuro-text-tertiary uppercase">Base</th>
                    <th className="text-center py-1 px-1 font-medium text-neuro-text-tertiary uppercase">Curr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neuro-border-subtle">
                  <OutcomeTableRow
                    icon={<Clock className="w-3 h-3" />}
                    label="Time"
                    baseline={keyMetricsBaseline.timeToReperfusion}
                    current={keyMetricsCurrent.timeToReperfusion}
                    unit="m"
                  />
                  <OutcomeTableRow
                    icon={<Brain className="w-3 h-3" />}
                    label="Core"
                    baseline={keyMetricsBaseline.finalCoreVolume}
                    current={keyMetricsCurrent.finalCoreVolume}
                    unit="cc"
                    invertDelta
                  />
                  <OutcomeTableRow
                    icon={<Heart className="w-3 h-3" />}
                    label="Salvage"
                    baseline={keyMetricsBaseline.penumbraSalvaged}
                    current={keyMetricsCurrent.penumbraSalvaged}
                    unit="cc"
                  />
                  <OutcomeTableRow
                    icon={<TrendingUp className="w-3 h-3" />}
                    label="Reperf"
                    baseline={keyMetricsBaseline.reperfusionProbability}
                    current={keyMetricsCurrent.reperfusionProbability}
                    unit="%"
                  />
                  <OutcomeTableRow
                    icon={<AlertTriangle className="w-3 h-3" />}
                    label="sICH"
                    baseline={keyMetricsBaseline.sichRisk}
                    current={keyMetricsCurrent.sichRisk}
                    unit="%"
                    invertDelta
                  />
                  <OutcomeTableRow
                    icon={<Skull className="w-3 h-3" />}
                    label="Mortality"
                    baseline={keyMetricsBaseline.mortalityRisk}
                    current={keyMetricsCurrent.mortalityRisk}
                    unit="%"
                    invertDelta
                  />
                  <OutcomeTableRow
                    icon={<Activity className="w-3 h-3" />}
                    label="mRS 0-2"
                    baseline={keyMetricsBaseline.mrs0to2Probability}
                    current={keyMetricsCurrent.mrs0to2Probability}
                    unit="%"
                    highlight
                  />
                </tbody>
              </table>
            </div>

            <div className="h-px bg-neuro-border-subtle" />

            <FamilyExplanation />
          </div>
        </aside>
      </div>
    </div>
  );
}

interface OutcomeTableRowProps {
  icon: React.ReactNode;
  label: string;
  baseline: number;
  current: number;
  unit: string;
  invertDelta?: boolean;
  highlight?: boolean;
}

function OutcomeTableRow({ icon, label, baseline, current, unit, highlight }: OutcomeTableRowProps) {
  return (
    <tr className="hover:bg-neuro-bg-tertiary/30 transition-colors">
      <td className="py-2 px-1">
        <div className="flex items-center gap-2">
          <div className="text-neuro-text-secondary">{icon}</div>
          <span className={`text-[10px] ${highlight ? 'text-neuro-salvaged font-medium' : 'text-neuro-text-secondary'}`}>
            {label}
          </span>
        </div>
      </td>
      <td className="py-2 px-1 text-center">
        <span className="text-[10px] text-neuro-text-secondary tabular-nums">
          {baseline} <span className="text-[9px]">{unit}</span>
        </span>
      </td>
      <td className="py-2 px-1 text-center">
        <span className={`text-[10px] font-medium tabular-nums ${highlight ? 'text-neuro-salvaged' : 'text-neuro-text-primary'}`}>
          {current} <span className="text-[9px]">{unit}</span>
        </span>
      </td>
    </tr>
  );
}
