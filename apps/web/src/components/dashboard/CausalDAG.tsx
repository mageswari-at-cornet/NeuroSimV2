import { useState } from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import { cn } from "../../lib/utils";
import { ChevronDown, Network, Activity, Brain, TrendingUp, Clock } from "lucide-react";

interface CausalDAGProps {
  className?: string;
}

interface DAGNode {
  id: string;
  label: string;
  delta: number | null;
  unit?: string;
  invert?: boolean;
  icon: React.ElementType;
}

export function CausalDAG({ className }: CausalDAGProps) {
  const [isExpanded, setIsExpanded] = useState(true);
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

  // Define DAG Node Data
  const getDAGNodes = (): DAGNode[] => {
    // Default flow
    let nodes: DAGNode[] = [
      { id: 'intervention', label: 'Intervention', delta: null, icon: Network },
      { id: 'mediator', label: 'Mediator', delta: null, icon: Activity },
      { id: 'pathophysiology', label: 'Pathophysiology', delta: null, icon: Brain },
      { id: 'outcome', label: 'Outcome', delta: null, icon: TrendingUp },
    ];

    switch (activeScenario) {
      case "routing":
        nodes = [
          { id: 'intervention', label: simulationParams.routingStrategy === 'drip-and-ship' ? 'Drip & Ship' : 'Mothership', delta: null, icon: Network },
          { id: 'mediator', label: 'Time to Reperfusion', delta: timeDelta, unit: 'min', invert: true, icon: Clock }, // Time up = Bad
          { id: 'pathophysiology', label: 'Core Volume', delta: coreDelta, unit: 'cc', invert: true, icon: Brain }, // Core up = Bad
          { id: 'outcome', label: 'mRS 0-2', delta: mrsDelta, unit: '%', invert: false, icon: TrendingUp }, // mRS up = Good
        ];
        break;
      case "bridging":
        nodes = [
          { id: 'intervention', label: simulationParams.treatmentStrategy === 'bridging' ? 'Bridging IVT' : 'Direct EVT', delta: null, icon: Network },
          { id: 'mediator', label: 'Recanalization Prob', delta: reperfDelta, unit: '%', invert: false, icon: Activity }, // Reperf up = Good
          { id: 'pathophysiology', label: 'Core Volume', delta: coreDelta, unit: 'cc', invert: true, icon: Brain },
          { id: 'outcome', label: 'mRS 0-2', delta: mrsDelta, unit: '%', invert: false, icon: TrendingUp },
        ];
        break;
      // Add other cases as needed, falling back to routing structure for now
      default:
        nodes = [
          { id: 'intervention', label: 'Intervention', delta: null, icon: Network },
          { id: 'mediator', label: 'Time to Reperfusion', delta: timeDelta, unit: 'min', invert: true, icon: Clock },
          { id: 'pathophysiology', label: 'Core Volume', delta: coreDelta, unit: 'cc', invert: true, icon: Brain },
          { id: 'outcome', label: 'mRS 0-2', delta: mrsDelta, unit: '%', invert: false, icon: TrendingUp },
        ];
    }
    return nodes;
  };

  const dagNodes = getDAGNodes();

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

          {/* Visual DAG Graph */}
          <div className="relative py-4">
            {/* Connecting Line (Absolute) */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-neuro-border-subtle -z-10 transform -translate-y-1/2" />

            <div className="flex justify-between items-start gap-2">
              {dagNodes.map((node, index) => {
                const NodeIcon = node.icon;
                const isPositive = node.delta !== null ? (node.invert ? -node.delta! > 0 : node.delta! > 0) : null;
                const deltaColor = node.delta === 0 ? "text-neuro-text-tertiary" : isPositive ? "text-neuro-positive" : "text-neuro-negative";
                const ringColor = node.delta === null ? "ring-neuro-border-subtle" : isPositive ? "ring-neuro-positive/50" : node.delta === 0 ? "ring-neuro-border-subtle" : "ring-neuro-negative/50";

                return (
                  <div key={index} className="flex flex-col items-center flex-1 max-w-[80px]">
                    {/* Node Circle */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-neuro-bg-tertiary border-2 border-neuro-bg-primary shadow-lg ring-2 z-10 transition-all duration-500",
                      ringColor
                    )}>
                      <NodeIcon className={cn("w-5 h-5", node.delta !== null ? deltaColor : "text-neuro-text-primary")} />
                    </div>

                    {/* Node Label */}
                    <div className="mt-2 text-center">
                      <p className="text-[10px] font-medium text-neuro-text-secondary leading-tight min-h-[2.5em]">
                        {node.label}
                      </p>

                      {/* Delta Value */}
                      {node.delta !== null && (
                        <p className={cn("text-[10px] font-bold mt-0.5", deltaColor)}>
                          {node.delta > 0 ? "+" : ""}{node.delta}{node.unit}
                        </p>
                      )}
                    </div>

                    {/* Arrow for next node (except last) - Visual Only, rendered via flex gap usually but here we use the absolute line + custom markers if needed. 
                        The absolute line handles the connection. We can add small chevrons between if we want.
                    */}
                  </div>
                );
              })}
            </div>

            {/* Inter-node Arrows (Overlay) */}
            <div className="absolute top-1/2 left-0 w-full flex justify-between px-[12%] -z-0 transform -translate-y-1/2 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 flex justify-center">
                  <div className="w-2 h-2 border-t-2 border-r-2 border-neuro-border-subtle transform rotate-45 translate-x-1/2" />
                </div>
              ))}
            </div>

          </div>

          {/* Detailed Narrative */}
          <div className="p-3 rounded-lg bg-neuro-bg-tertiary/50 border border-neuro-border-subtle">
            <p className="text-xs text-neuro-text-secondary leading-relaxed">
              {getScenarioNarrative()}
            </p>
          </div>

          {/* Factor Contributions - Collapsible or always visible? Let's keep it visible for detail */}
          <div className="space-y-2 pt-2 border-t border-neuro-border-subtle">
            <h4 className="text-xs font-medium text-neuro-text-tertiary uppercase tracking-wider">
              Detailed Factors
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Time to Reperf.</span>
                {formatDelta(timeDelta, " min", true)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Core Growth</span>
                {formatDelta(coreDelta, " cc", true)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Salvage</span>
                {formatDelta(salvageDelta, " cc")}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neuro-text-secondary">Reperf. Prob</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
