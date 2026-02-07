// Patient phenotype (X) - fixed per scenario
export interface PatientPhenotype {
    age: number;
    sex: 'M' | 'F';
    nihss: number;
    occlusion: string;
    occlusionType: 'M1' | 'M2' | 'ICA' | 'ICA_T' | 'TANDEM' | 'OTHER';
    collaterals: number;
    coreInitial: number;
    territory: number;
    mismatchStrength?: 'Mild' | 'Moderate' | 'Strong';
    onsetTime: string;
    systolicBP: number;
}

// Action parameters (A) - user-controlled
export interface ActionParameters {
    // Scenario 1: Routing
    routingStrategy?: 'drip-and-ship' | 'direct-mothership';
    transferDelay?: number;
    doorToGroinTime?: number;
    ivtWorkflowDelay?: number;

    // Scenario 2: Bridging
    treatmentStrategy?: 'evt-alone' | 'bridging';

    // Scenario 3: Imaging
    imagingPathway?: 'standard' | 'direct-to-angio';

    // Scenario 4: Tandem
    tandemApproach?: 'balloon-only' | 'acute-stenting';

    // Scenario 5: Large Core
    largeCoreStrategy?: 'medical' | 'thrombectomy';

    // Scenario 6: Wake-up
    mismatchStrength?: 'mild' | 'moderate' | 'strong';
    wakeUpStrategy?: 'evt-alone' | 'ivt-plus-evt';

    // Shared
    sbpTarget?: number;
}

// Mediator results (M)
export interface MediatorResults {
    timeToReperfusion: number;
    finalCoreVolume: number;
    penumbraAtRisk: number;
    penumbraSalvaged: number;
    reperfusionProbability: number;
}

// Outcome results (Y)
export interface OutcomeResults {
    sichRisk: number;
    mortalityRisk: number;
    mrs0to2Probability: number;
}

// Uncertainty interval
export interface UncertaintyInterval {
    p05: number;
    mean: number;
    p95: number;
}

// Uncertainty results for Monte Carlo mode
export interface UncertaintyResults {
    timeToReperfusion: UncertaintyInterval;
    finalCoreVolume: UncertaintyInterval;
    penumbraSalvaged: UncertaintyInterval;
    reperfusionProbability: UncertaintyInterval;
    sichRisk: UncertaintyInterval;
    mortalityRisk: UncertaintyInterval;
    mrs0to2Probability: UncertaintyInterval;
}

// Full simulation result
export interface SimulationResult {
    mediators: MediatorResults;
    outcomes: OutcomeResults;
    uncertainty?: UncertaintyResults;
}
