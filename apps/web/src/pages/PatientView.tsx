import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Header } from "../components/dashboard/Header";
import { ScenarioControls } from "../components/dashboard/ScenarioControls";
import { CausalChangeStrip } from "../components/dashboard/CausalChangeStrip";
import { ImagingViewer } from "../components/dashboard/ImagingViewer";
import { OutcomeAnalysisSection } from "../components/dashboard/OutcomeAnalysisSection";
import { PatientPanel } from "../components/dashboard/PatientPanel"; import { CausalDAG } from "../components/dashboard/CausalDAG";
import { FamilyExplanation } from "../components/dashboard/FamilyExplanation";
import { TimeSensitivityCurve } from "../components/dashboard/TimeSensitivityCurve";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { useDashboardStore } from "../store/dashboardStore";


interface PatientViewProps {
  patientId: string;
  onBackToDashboard: () => void;
}

export function PatientView({ patientId, onBackToDashboard }: PatientViewProps) {
  const {
    currentOutcomes,
    baselineOutcomes,
    activeScenario,
    simulationMode,
    simulationSource,
    uncertaintyOutcomes,
    baselineUncertainty,
    setSelectedPatient,
    timeSensitivityData,
    isCalculating,
    patientData,
  } = useDashboardStore();

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toggle chat
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Use store data directly
  const sensitivityData = timeSensitivityData;

  // Load patient data on mount
  useEffect(() => {
    setSelectedPatient(patientId);
  }, [patientId, setSelectedPatient]);

  const getActionText = () => {
    switch (activeScenario) {
      case "routing": return "Routing Strategy";
      case "bridging": return "Treatment Strategy";
      case "imaging": return "Imaging Pathway";
      case "tandem": return "Tandem Approach";
      case "large-core": return "Large Core Management";
      case "wake-up": return "Wake-Up Strategy";
      default: return "Intervention";
    }
  };

  const totalPenumbra = patientData.territoryAtRisk - patientData.initialCoreVolume;

  const tissueFateData = {
    core: currentOutcomes.finalCoreVolume,
    salvaged: currentOutcomes.penumbraSalvaged,
    atRisk: Math.max(0, totalPenumbra - currentOutcomes.penumbraSalvaged),
  };

  const outcomeData = [
    { metric: "mRS 0-2", baseline: baselineOutcomes.mrs0to2Probability, current: currentOutcomes.mrs0to2Probability, unit: "%" },
    { metric: "sICH Risk", baseline: baselineOutcomes.sichRisk, current: currentOutcomes.sichRisk, unit: "%" },
    { metric: "Mortality", baseline: baselineOutcomes.mortalityRisk, current: currentOutcomes.mortalityRisk, unit: "%" },
  ];



  const uncertaintyOutcomeData = [
    { metric: "mRS 0-2", baseline: baselineUncertainty.mrs0to2Probability, current: uncertaintyOutcomes.mrs0to2Probability, unit: "%" },
    { metric: "sICH Risk", baseline: baselineUncertainty.sichRisk, current: uncertaintyOutcomes.sichRisk, unit: "%" },
    { metric: "Mortality", baseline: baselineUncertainty.mortalityRisk, current: uncertaintyOutcomes.mortalityRisk, unit: "%" },
  ];

  return (
    <div className="h-screen bg-neuro-bg-primary flex flex-col pt-[80px]">
      {/* Header */}
      <Header
        onBackToDashboard={onBackToDashboard}
        isChatOpen={isChatOpen}
        onChatToggle={toggleChat}
      />

      {/* Main Layout */}
      <div className={cn(
        "flex-1 flex overflow-hidden",
        isChatOpen && "mr-80"
      )}>
        {/* Left Sidebar - Scenario Controls - Always visible */}
        <aside className={cn("flex-shrink-0 bg-neuro-bg-secondary/50 border-r border-neuro-border-subtle overflow-y-auto scrollbar-hide", isChatOpen ? "w-56" : "w-64")}>
          <div className="p-4">
            <ScenarioControls isCompact={isChatOpen} />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* Loading Overlay */}
          {isCalculating && (
            <div className="absolute inset-0 z-50 bg-neuro-bg-primary/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-neuro-bg-secondary border border-neuro-border-subtle shadow-xl">
                <div className="w-8 h-8 border-4 border-neuro-salvaged border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-neuro-text-primary">Simulating Outcomes...</p>
                <p className="text-xs text-neuro-text-tertiary">Consulting AI Model</p>
              </div>
            </div>
          )}

          {/* Causal Change Summary Strip */}
          <div className="px-4 py-3 border-b border-neuro-border-subtle">
            <CausalChangeStrip
              change={{
                action: getActionText(),
                mediator: `Time-to-reperfusion (${currentOutcomes.timeToReperfusion} min)`,
                outcome: `mRS 0-2 ${currentOutcomes.mrs0to2Probability >= baselineOutcomes.mrs0to2Probability ? "↑" : "↓"} ${Math.abs(Number((currentOutcomes.mrs0to2Probability - baselineOutcomes.mrs0to2Probability).toFixed(2)))}%`,
                outcomeDelta: Number((currentOutcomes.mrs0to2Probability - baselineOutcomes.mrs0to2Probability).toFixed(2)),
              }}
            />
          </div>

          {/* Main Canvas */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
            <div className="space-y-4">
              {/* Row 1: Imaging - Full Width */}
              <div className="w-full">
                <ImagingViewer className="min-h-[180px]" />
              </div>

              {/* Row 2: Consolidated Outcome Analysis */}
              <div className="w-full">
                <OutcomeAnalysisSection
                  tissueData={tissueFateData}
                  outcomeData={outcomeData}
                  uncertaintyData={uncertaintyOutcomeData}
                  baselineOutcomes={baselineOutcomes}
                  currentOutcomes={currentOutcomes}
                  simulationMode={simulationMode}
                  simulationSource={simulationSource}
                  isCompact={isChatOpen}
                />
              </div>

              {/* Row 3: Time Sensitivity Curve */}
              <TimeSensitivityCurve
                currentTime={currentOutcomes.timeToReperfusion}
                sensitivityData={sensitivityData}
              />

              {/* Row 4: Causal Pathway */}
              <CausalDAG />
            </div>
          </div>
        </main>

        {/* Right Panel - Patient Info & Explanation - Always visible */}
        <aside className="w-72 flex-shrink-0 bg-neuro-bg-secondary/50 border-l border-neuro-border-subtle overflow-y-auto scrollbar-hide">
          <div className="p-4 space-y-6">
            <PatientPanel />
            <div className="h-px bg-neuro-border-subtle" />
            <FamilyExplanation />
          </div>
        </aside>

        {/* Chat Sidebar - Fixed on right */}
        <aside className={cn(
          "fixed right-0 top-[80px] bottom-0 w-80 bg-neuro-bg-secondary border-l border-neuro-border-subtle z-40 shadow-2xl transition-transform duration-300 ease-in-out",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <ChatSidebar onClose={() => setIsChatOpen(false)} />
        </aside>
      </div>
    </div>
  );
}


