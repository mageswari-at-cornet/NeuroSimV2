// Shared types for the dashboard store and patient data

export type Scenario =
    | "routing"
    | "bridging"
    | "imaging"
    | "tandem"
    | "large-core"
    | "wake-up";

export interface PatientData {
    age: number;
    sex: "M" | "F" | "Other";
    nihss: number;
    occlusionLocation: string;
    collateralScore: number;
    initialCoreVolume: number;
    territoryAtRisk: number;
    systolicBP: number;
    onsetTime: string | "wake-up";
}

export interface SimulationParams {
    // Scenario 1: Routing
    routingStrategy: "drip-and-ship" | "direct-mothership";
    transferDelay: number;
    doorToGroinTime: number;
    ivtWorkflowDelay: number;

    // Scenario 2: Bridging
    treatmentStrategy: "evt-alone" | "bridging";

    // Scenario 3: Imaging
    imagingPathway: "standard" | "direct-to-angio";

    // Scenario 4: Tandem
    tandemApproach: "balloon-only" | "acute-stenting";

    // Scenario 5: Large Core
    largeCoreStrategy: "medical" | "thrombectomy";

    // Scenario 6: Wake-up
    mismatchStrength: "mild" | "moderate" | "strong";
    wakeUpStrategy: "evt-alone" | "ivt-plus-evt";

    // Shared
    sbpTarget: number;
}

export interface OutcomeMetrics {
    timeToReperfusion: number;
    finalCoreVolume: number;
    penumbraAtRisk: number;
    penumbraSalvaged: number;
    reperfusionProbability: number;
    sichRisk: number;
    mortalityRisk: number;
    mrs0to2Probability: number;
}

export interface UncertaintyOutcome {
    p05: number;  // 5th percentile
    mean: number; // mean/average
    p95: number;  // 95th percentile
}

export interface UncertaintyOutcomes {
    timeToReperfusion: UncertaintyOutcome;
    finalCoreVolume: UncertaintyOutcome;
    penumbraSalvaged: UncertaintyOutcome;
    reperfusionProbability: UncertaintyOutcome;
    sichRisk: UncertaintyOutcome;
    mortalityRisk: UncertaintyOutcome;
    mrs0to2Probability: UncertaintyOutcome;
}
