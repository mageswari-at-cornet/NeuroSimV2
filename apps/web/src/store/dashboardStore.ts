import { create } from "zustand";
import { getPatientById, getDefaultPatient } from "../data/patientData";
import { simulatePathway } from "../lib/simulationEngine";
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
function calculateOutcomes(
  params: SimulationParams,
  patientData: PatientData,
  mode: 'deterministic' | 'monte-carlo' = 'deterministic'
): { outcomes: OutcomeMetrics; uncertainty?: UncertaintyOutcomes } {
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
  const result = simulatePathway(phenotype, actions, { mode, nRuns: 200 });

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
function calculateTimeSensitivity(
  params: SimulationParams,
  patientData: PatientData,
  currentTime: number
): Array<{ time: number; mrs0to2: number; label: string; isCurrent: boolean }> {
  const timePoints = [
    { offset: -60, label: "-60 min" },
    { offset: -30, label: "-30 min" },
    { offset: 0, label: "Current" },
    { offset: 30, label: "+30 min" },
    { offset: 60, label: "+60 min" },
  ];

  return timePoints.map(point => {
    const testTime = Math.max(0, currentTime + point.offset);

    // Create modified params with adjusted time
    // We adjust doorToGroinTime by the offset delta
    const modifiedParams = {
      ...params,
      doorToGroinTime: Math.max(0, params.doorToGroinTime + point.offset),
    };

    // Run simulation at this time point
    const { outcomes } = calculateOutcomes(modifiedParams, patientData, 'deterministic');

    return {
      time: testTime,
      mrs0to2: Math.round(outcomes.mrs0to2Probability),
      label: point.label,
      isCurrent: point.offset === 0,
    };
  });
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

  // Actions
  setSelectedPatient: (patientId: string) => void;
  setActiveScenario: (scenario: Scenario) => void;
  updatePatientData: (data: Partial<PatientData>) => void;
  updateSimulationParams: (params: Partial<SimulationParams>) => void;
  setSimulationMode: (mode: "deterministic" | "monte-carlo") => void;
  resetToBaseline: () => void;
  getTimeSensitivity: () => Array<{ time: number; mrs0to2: number; label: string; isCurrent: boolean }>;
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
  },

  setActiveScenario: (scenario) => {
    set({ activeScenario: scenario });
    // Recalculate outcomes using client-side simulation
    const state = get();
    const { outcomes, uncertainty } = calculateOutcomes(state.simulationParams, state.patientData, state.simulationMode);
    set({ currentOutcomes: outcomes });
    if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
  },

  updatePatientData: (data) =>
    set((state) => ({
      patientData: { ...state.patientData, ...data },
    })),

  updateSimulationParams: (params) => {
    const state = get();
    const newParams = { ...state.simulationParams, ...params };
    set({ simulationParams: newParams });

    // Recalculate outcomes using client-side simulation
    const { outcomes, uncertainty } = calculateOutcomes(newParams, state.patientData, state.simulationMode);
    set({ currentOutcomes: outcomes });
    if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
  },

  setSimulationMode: (mode) => {
    set({ simulationMode: mode });
    // Recalculate outcomes using client-side simulation
    const state = get();
    const { outcomes, uncertainty } = calculateOutcomes(state.simulationParams, state.patientData, mode);
    set({ currentOutcomes: outcomes });
    if (uncertainty) set({ uncertaintyOutcomes: uncertainty });
  },

  resetToBaseline: () =>
    set((state) => ({
      currentOutcomes: state.baselineOutcomes,
      uncertaintyOutcomes: state.baselineUncertainty,
      simulationParams: defaultSimulationParams,
    })),

  getTimeSensitivity: () => {
    const state = get();
    return calculateTimeSensitivity(
      state.simulationParams,
      state.patientData,
      state.currentOutcomes.timeToReperfusion
    );
  },
}));
