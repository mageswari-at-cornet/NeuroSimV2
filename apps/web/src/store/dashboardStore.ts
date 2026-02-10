import { create } from "zustand";
import { getPatientById, getDefaultPatient } from "../data/patientData";
// Remove simulationEngine imports from top level
import type { PatientPhenotype, ActionParameters } from "../lib/types";
import type {
  Scenario,
  PatientData,
  SimulationParams,
  OutcomeMetrics,
  UncertaintyOutcome,
  UncertaintyOutcomes,
} from "../types/dashboard";

// Re-export types for backward compatibility
export type { Scenario, PatientData, SimulationParams, OutcomeMetrics, UncertaintyOutcome, UncertaintyOutcomes };

// Helper to map occlusion string to type
function normalizeOcclusionType(occlusion: string): 'M1' | 'M2' | 'ICA' | 'ICA_T' | 'TANDEM' | 'OTHER' {
  const s = occlusion.toLowerCase();
  if (s.includes('tandem') || s.includes('+')) return 'TANDEM';
  if (s.includes('ica') && (s.includes('terminus') || s.includes('t'))) return 'ICA_T';
  if (s.includes('m2')) return 'M2';
  if (s.includes('m1')) return 'M1';
  if (s.includes('ica')) return 'ICA';
  return 'OTHER';
}

// Helper to capitalize first letter for enum fields
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Client-side simulation calculation using the simulation engine
async function calculateOutcomes(
  params: SimulationParams,
  patientData: PatientData,
  mode: 'deterministic' | 'monte-carlo' = 'deterministic'
): Promise<{ outcomes: OutcomeMetrics; uncertainty?: UncertaintyOutcomes }> {
  // Convert our store types to simulation engine types
  const phenotype: PatientPhenotype = {
    age: patientData.age,
    sex: patientData.sex === 'Other' ? 'F' : patientData.sex,
    nihss: patientData.nihss,
    occlusion: patientData.occlusionLocation,
    occlusionType: normalizeOcclusionType(patientData.occlusionLocation),
    collaterals: patientData.collateralScore,
    coreInitial: patientData.initialCoreVolume,
    territory: patientData.territoryAtRisk,
    mismatchStrength: params.mismatchStrength ? capitalize(params.mismatchStrength) as 'Mild' | 'Moderate' | 'Strong' : 'Moderate',
    onsetTime: patientData.onsetTime,
    systolicBP: patientData.systolicBP,
  };

  const actions: ActionParameters = {
    routingStrategy: params.routingStrategy,
    transferDelay: params.transferDelay,
    doorToGroinTime: params.doorToGroinTime,
    ivtWorkflowDelay: params.ivtWorkflowDelay,
    treatmentStrategy: params.treatmentStrategy,
    imagingPathway: params.imagingPathway,
    tandemApproach: params.tandemApproach,
    largeCoreStrategy: params.largeCoreStrategy,
    wakeUpStrategy: params.wakeUpStrategy,
    sbpTarget: params.sbpTarget,
  };

  // Run simulation
  let result: any; // Use any to allow for updated types
  if (mode === 'monte-carlo') {
    // Use the new Mega-Batch Monte Carlo
    const { calculateMonteCarloStats } = await import("../lib/simulationEngine");
    result = await calculateMonteCarloStats(phenotype, actions, 50);
  } else {
    // Use standard single run (legacy but essentially batch)
    const { simulatePathway } = await import("../lib/simulationEngine");
    result = await simulatePathway(phenotype, actions, { mode, nRuns: 1 });
  }

  // Convert simulation results to our store types
  const outcomes: OutcomeMetrics = {
    timeToReperfusion: result.mediators.timeToReperfusion,
    finalCoreVolume: result.mediators.finalCoreVolume,
    penumbraAtRisk: result.mediators.penumbraAtRisk,
    penumbraSalvaged: result.mediators.penumbraSalvaged,
    reperfusionProbability: result.mediators.reperfusionProbability,
    sichRisk: result.outcomes.sichRisk,
    mortalityRisk: result.outcomes.mortalityRisk,
    mrs0to2Probability: result.outcomes.mrs0to2Probability,
  };

  // Convert uncertainty if present
  const uncertainty = result.uncertainty ? {
    timeToReperfusion: result.uncertainty.timeToReperfusion,
    finalCoreVolume: result.uncertainty.finalCoreVolume,
    penumbraSalvaged: result.uncertainty.penumbraSalvaged,
    reperfusionProbability: result.uncertainty.reperfusionProbability,
    sichRisk: result.uncertainty.sichRisk,
    mortalityRisk: result.uncertainty.mortalityRisk,
    mrs0to2Probability: result.uncertainty.mrs0to2Probability,
  } : undefined;

  return { outcomes, uncertainty };
}

// Calculate time sensitivity curve data
async function calculateTimeSensitivity(
  params: SimulationParams,
  patientData: PatientData,
  currentTime: number
): Promise<Array<{ time: number; mrs0to2: number; label: string; isCurrent: boolean }>> {
  const timePoints = [
    { offset: -60, label: "-60 min" },
    { offset: -30, label: "-30 min" },
    { offset: 0, label: "Current" },
    { offset: 30, label: "+30 min" },
    { offset: 60, label: "+60 min" },
  ];

  // Prepare input scenarios for the new batch function
  const phenotype: PatientPhenotype = {
    age: patientData.age,
    sex: patientData.sex === 'Other' ? 'F' : patientData.sex,
    nihss: patientData.nihss,
    occlusion: patientData.occlusionLocation,
    occlusionType: normalizeOcclusionType(patientData.occlusionLocation),
    collaterals: patientData.collateralScore,
    coreInitial: patientData.initialCoreVolume,
    territory: patientData.territoryAtRisk,
    mismatchStrength: params.mismatchStrength ? capitalize(params.mismatchStrength) as 'Mild' | 'Moderate' | 'Strong' : 'Moderate',
    onsetTime: patientData.onsetTime,
    systolicBP: patientData.systolicBP,
  };

  const baseActions: ActionParameters = {
    routingStrategy: params.routingStrategy,
    transferDelay: params.transferDelay,
    doorToGroinTime: params.doorToGroinTime,
    ivtWorkflowDelay: params.ivtWorkflowDelay,
    treatmentStrategy: params.treatmentStrategy,
    imagingPathway: params.imagingPathway,
    tandemApproach: params.tandemApproach,
    largeCoreStrategy: params.largeCoreStrategy,
    wakeUpStrategy: params.wakeUpStrategy,
    sbpTarget: params.sbpTarget,
  };

  const scenarios = timePoints.map(point => {
    return {
      id: point.label,
      phenotype, // Same phenotype
      actions: {
        ...baseActions,
        doorToGroinTime: Math.max(0, (baseActions.doorToGroinTime || 0) + point.offset), // Modify time
      }
    };
  });

  try {
    // Use the new Mega-Batch Scenarios function
    const { calculateScenarios } = await import("../lib/simulationEngine");
    const results = await calculateScenarios(scenarios);

    // Map results back to the graph format
    return timePoints.map(point => {
      const res = results.find(r => r.id === point.label);
      const testTime = Math.max(0, currentTime + point.offset);

      return {
        time: testTime,
        mrs0to2: res ? Math.round(res.result.mrs0to2Probability) : 0,
        label: point.label,
        isCurrent: point.offset === 0,
      };
    });
  } catch (e) {
    console.error("Time sensitivity batch failed", e);
    // Fallback: return zeros
    return timePoints.map(point => ({
      time: Math.max(0, currentTime + point.offset),
      mrs0to2: 0,
      label: point.label,
      isCurrent: point.offset === 0,
    }));
  }
}

interface DashboardState {
  // Current selections
  selectedPatientId: string;
  activeScenario: Scenario;
  patientData: PatientData;
  simulationParams: SimulationParams;
  baselineOutcomes: OutcomeMetrics;
  currentOutcomes: OutcomeMetrics;
  simulationMode: "deterministic" | "monte-carlo";
  uncertaintyOutcomes: UncertaintyOutcomes;
  baselineUncertainty: UncertaintyOutcomes;

  // Async state
  isCalculating: boolean;
  timeSensitivityData: Array<{ time: number; mrs0to2: number; label: string; isCurrent: boolean }>;

  // Actions
  setSelectedPatient: (patientId: string) => void;
  setActiveScenario: (scenario: Scenario) => Promise<void>;
  updatePatientData: (data: Partial<PatientData>) => Promise<void>;
  updateSimulationParams: (params: Partial<SimulationParams>) => Promise<void>;
  setSimulationMode: (mode: "deterministic" | "monte-carlo") => Promise<void>;
  resetToBaseline: () => void;
  // removed getTimeSensitivity as it's now stored in state
}

const defaultPatientData: PatientData = {
  age: 68,
  sex: "M",
  nihss: 18,
  occlusionLocation: "M1",
  collateralScore: 1.5,
  initialCoreVolume: 45,
  territoryAtRisk: 180,
  systolicBP: 165,
  onsetTime: "2h 14m ago",
};

const defaultSimulationParams: SimulationParams = {
  routingStrategy: "drip-and-ship",
  transferDelay: 45,
  doorToGroinTime: 60,
  ivtWorkflowDelay: 8,
  treatmentStrategy: "evt-alone",
  imagingPathway: "standard",
  tandemApproach: "balloon-only",
  largeCoreStrategy: "thrombectomy",
  mismatchStrength: "moderate",
  wakeUpStrategy: "evt-alone",
  sbpTarget: 140,
};

const defaultOutcomes: OutcomeMetrics = {
  timeToReperfusion: 180,
  finalCoreVolume: 68,
  penumbraAtRisk: 135,
  penumbraSalvaged: 45,
  reperfusionProbability: 78,
  sichRisk: 6,
  mortalityRisk: 18,
  mrs0to2Probability: 48,
};

const defaultUncertaintyOutcomes: UncertaintyOutcomes = {
  timeToReperfusion: { p05: 150, mean: 180, p95: 210 },
  finalCoreVolume: { p05: 55, mean: 68, p95: 82 },
  penumbraSalvaged: { p05: 35, mean: 45, p95: 55 },
  reperfusionProbability: { p05: 68, mean: 78, p95: 88 },
  sichRisk: { p05: 4, mean: 6, p95: 9 },
  mortalityRisk: { p05: 14, mean: 18, p95: 23 },
  mrs0to2Probability: { p05: 40, mean: 48, p95: 56 },
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedPatientId: "P1",
  activeScenario: "routing",
  patientData: defaultPatientData,
  simulationParams: defaultSimulationParams,
  baselineOutcomes: defaultOutcomes,
  currentOutcomes: defaultOutcomes,
  simulationMode: "deterministic",
  uncertaintyOutcomes: defaultUncertaintyOutcomes,
  baselineUncertainty: defaultUncertaintyOutcomes,
  isCalculating: false,
  timeSensitivityData: [],

  setSelectedPatient: (patientId: string) => {
    const patient = getPatientById(patientId);
    if (!patient) {
      console.warn(`Patient ${patientId} not found, using default`);
      const defaultPatient = getDefaultPatient();
      set({
        selectedPatientId: defaultPatient.id,
        patientData: defaultPatient.data,
        activeScenario: defaultPatient.scenario,
      });
      return;
    }
    set({
      selectedPatientId: patient.id,
      patientData: patient.data,
      activeScenario: patient.scenario,
    });
    // Trigger calculation
    get().updateSimulationParams({});
  },

  setActiveScenario: async (scenario) => {
    set({ activeScenario: scenario, isCalculating: true });
    try {
      const state = get();
      const { outcomes, uncertainty } = await calculateOutcomes(state.simulationParams, state.patientData, state.simulationMode);

      const timeSensitivity = await calculateTimeSensitivity(
        state.simulationParams,
        state.patientData,
        outcomes.timeToReperfusion
      );

      set({ currentOutcomes: outcomes, timeSensitivityData: timeSensitivity, isCalculating: false });
      if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
    } catch (e) {
      console.error("Simulation failed", e);
      set({ isCalculating: false });
    }
  },

  updatePatientData: async (data) => {
    set((state) => ({
      patientData: { ...state.patientData, ...data },
      isCalculating: true
    }));

    try {
      const state = get();
      const { outcomes, uncertainty } = await calculateOutcomes(state.simulationParams, state.patientData, state.simulationMode);

      const timeSensitivity = await calculateTimeSensitivity(
        state.simulationParams,
        state.patientData,
        outcomes.timeToReperfusion
      );

      set({ currentOutcomes: outcomes, timeSensitivityData: timeSensitivity, isCalculating: false });
      if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
    } catch (e) {
      console.error("Simulation failed", e);
      set({ isCalculating: false });
    }
  },

  updateSimulationParams: async (params) => {
    set((state) => ({
      simulationParams: { ...state.simulationParams, ...params },
      isCalculating: true
    }));

    try {
      const state = get();
      const { outcomes, uncertainty } = await calculateOutcomes(state.simulationParams, state.patientData, state.simulationMode);

      const timeSensitivity = await calculateTimeSensitivity(
        state.simulationParams,
        state.patientData,
        outcomes.timeToReperfusion
      );

      set({ currentOutcomes: outcomes, timeSensitivityData: timeSensitivity, isCalculating: false });
      if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
    } catch (e) {
      console.error("Simulation failed", e);
      set({ isCalculating: false });
    }
  },

  setSimulationMode: async (mode) => {
    set({ simulationMode: mode, isCalculating: true });

    try {
      const state = get();
      const { outcomes, uncertainty } = await calculateOutcomes(state.simulationParams, state.patientData, mode);
      set({ currentOutcomes: outcomes, isCalculating: false });
      if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
    } catch (e) {
      console.error("Simulation failed", e);
      set({ isCalculating: false });
    }
  },

  resetToBaseline: () =>
    set((state) => ({
      currentOutcomes: state.baselineOutcomes,
      uncertaintyOutcomes: state.baselineUncertainty,
      simulationParams: defaultSimulationParams,
    })),
}));
