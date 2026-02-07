import type { PatientPhenotype, ActionParameters, SimulationResult, MediatorResults, OutcomeResults, UncertaintyResults, UncertaintyInterval } from './types';

interface SimulationOptions {
    mode: 'deterministic' | 'monte-carlo';
    seed?: number;
    nRuns?: number;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Clamp a value between min and max
 */
function clamp(x: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, x));
}

/**
 * Normalize occlusion string to standard type
 * Ported from Python app.py
 */
function normalizeOcclusion(occlusionStr: string): string {
    const s = (occlusionStr || '').trim().toLowerCase();

    if (s.includes('tandem') || s.includes('+')) {
        return 'TANDEM';
    }
    if (s.includes('ica') && (s.includes('terminus') || s.includes('ica-t') || s.includes('ica t'))) {
        return 'ICA_T';
    }
    if (s.includes('ica') && s.includes('m1')) {
        return 'TANDEM';
    }
    if (s.includes('m2')) {
        return 'M2';
    }
    if (s.includes('m1')) {
        return 'M1';
    }
    if (s.includes('ica')) {
        return 'ICA';
    }
    return 'OTHER';
}

/**
 * Blood pressure penalty multiplier for core growth
 * Ported from Python app.py - affects core growth based on SBP and collaterals
 */
function bpPenaltyMultiplier(sbp: number, collaterals: number): number {
    if (collaterals < 1.5) {
        if (sbp < 135) return 1.80;
    } else if (collaterals < 2.2) {
        if (sbp < 125) return 1.45;
    } else {
        if (sbp < 110) return 1.25;
    }

    if (sbp > 185) return 1.08;
    return 1.0;
}

/**
 * Fast progressor multiplier for uncertainty modeling
 * Uses beta distribution (approximated) for patient variability in core growth
 * Ported from Python app.py
 */
function fastProgressorMultiplier(_seed: number, mode: 'deterministic' | 'monte-carlo'): number {
    if (mode === 'deterministic') {
        return 0.25; // Median of Beta(2,5)
    }
    // For Monte Carlo: approximate Beta(2,5) with bounded normal
    // Beta(2,5) has mean ~0.29, mode ~0.25, most mass between 0-0.6
    const u1 = Math.random();
    const u2 = Math.random();
    // Box-Muller transform for normal, then transform to approximate beta
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const beta = clamp(0.29 + normal * 0.15, 0.05, 0.95);
    return beta;
}

/**
 * Main simulation function - runs either deterministic or Monte Carlo simulation
 */
export function simulatePathway(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    options: SimulationOptions
): SimulationResult {
    if (options.mode === 'deterministic') {
        return simulateOnce(phenotype, actions, 'deterministic');
    }

    return simulateMonteCarlo(phenotype, actions, options.nRuns ?? 200, options.seed);
}

/**
 * Single deterministic or Monte Carlo simulation run - ENHANCED from Python app.py
 * Now includes BP penalty multiplier, fast-progressor modeling, and improved core growth calculation
 */
function simulateOnce(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    mode: 'deterministic' | 'monte-carlo'
): SimulationResult {
    const collaterals = phenotype.collaterals;
    const coreInitial = phenotype.coreInitial;
    const territory = phenotype.territory;

    // Calculate time to reperfusion
    const timeToReperfusion = calculateTimeToReperfusion(phenotype, actions);

    // Core growth calculation - ENHANCED from Python
    // base_rate = 0.18 + 0.14 * (2.5 - coll), clamped to [0.12, 0.55] cc/min
    let baseRate = 0.18 + 0.14 * (2.5 - collaterals);
    baseRate = clamp(baseRate, 0.12, 0.55);

    // Fast progressor multiplier (Beta distribution for uncertainty)
    const fastMult = 0.85 + 0.9 * fastProgressorMultiplier(0, mode);

    // Blood pressure penalty multiplier
    const sbp = actions.sbpTarget ?? phenotype.systolicBP;
    const bpMult = bpPenaltyMultiplier(sbp, collaterals);

    // Growth noise for Monte Carlo
    const growthNoise = mode === 'monte-carlo' ? (Math.random() * 0.16 + 0.92) : 1.0; // Normal(1.0, 0.08)

    // Final core growth formula from Python
    const growth = timeToReperfusion * baseRate * fastMult * bpMult * growthNoise;
    const finalCore = clamp(coreInitial + growth, 5, territory - 5);

    // Penumbra calculations
    const penumbraAtRisk = Math.max(0, territory - coreInitial);

    // Reperfusion probability
    const reperfProb = computeReperfusionProbability(phenotype, actions, timeToReperfusion);

    // Salvage fraction calculation (simplified from Python)
    let salvageFracIfSuccess = 0.78;
    let salvageFracIfFail = 0.10;

    // Scenario 3 (Imaging): Standard imaging improves selection
    if (actions.imagingPathway === 'standard') {
        salvageFracIfSuccess += 0.03;
    }

    // Scenario 6 (Wake-up): Mismatch strength affects salvage
    const mismatchStr = phenotype.mismatchStrength || 'Moderate';
    if (actions.wakeUpStrategy === 'ivt-plus-evt' || actions.wakeUpStrategy === 'evt-alone') {
        if (mismatchStr === 'Strong') {
            salvageFracIfSuccess += 0.06;
        } else if (mismatchStr === 'Mild') {
            salvageFracIfSuccess -= 0.04;
        }
    }

    // Core size penalties on salvage
    if (coreInitial > 70) {
        salvageFracIfSuccess -= 0.18;
        salvageFracIfFail = 0.05;
    } else if (coreInitial > 40) {
        salvageFracIfSuccess -= 0.08;
    }

    salvageFracIfSuccess = clamp(salvageFracIfSuccess, 0.25, 0.90);
    salvageFracIfFail = clamp(salvageFracIfFail, 0.02, 0.20);

    // Expected salvage fraction weighted by reperfusion probability
    const p = clamp(reperfProb / 100.0, 0.0, 1.0);
    const expectedSalvageFrac = p * salvageFracIfSuccess + (1 - p) * salvageFracIfFail;

    const penumbraAfterGrowth = Math.max(0, territory - finalCore);
    const penumbraSalvaged = penumbraAfterGrowth * expectedSalvageFrac;

    // Outcome calculations with updated signatures
    const sichRisk = computeSICHRisk(phenotype, actions, finalCore);
    const mortalityRisk = computeMortalityRisk(finalCore, sichRisk, phenotype, actions);
    const mrs0to2 = computeMRS(finalCore, reperfProb, sichRisk, phenotype, actions);

    const mediators: MediatorResults = {
        timeToReperfusion: Math.round(timeToReperfusion),
        finalCoreVolume: Math.round(finalCore),
        penumbraAtRisk: Math.round(penumbraAtRisk),
        penumbraSalvaged: Math.round(penumbraSalvaged),
        reperfusionProbability: Math.round(reperfProb),
    };

    const outcomes: OutcomeResults = {
        sichRisk: Math.round(sichRisk),
        mortalityRisk: Math.round(mortalityRisk),
        mrs0to2Probability: Math.round(mrs0to2),
    };

    return { mediators, outcomes };
}

/**
 * Calculate time to reperfusion based on actions
 */
function calculateTimeToReperfusion(phenotype: PatientPhenotype, actions: ActionParameters): number {
    const transferDelay = actions.transferDelay ?? 45;
    const doorToGroin = actions.doorToGroinTime ?? 60;
    const ivtDelay = actions.ivtWorkflowDelay ?? 8;

    let time = 120; // Base time

    // Routing scenario
    if (actions.routingStrategy === 'drip-and-ship') {
        time = transferDelay + doorToGroin + ivtDelay;
    } else if (actions.routingStrategy === 'direct-mothership') {
        time = doorToGroin + 35; // No transfer, but longer initial travel
    }

    // Bridging adds IVT delay
    if (actions.treatmentStrategy === 'bridging') {
        time += ivtDelay;
    }

    // Standard imaging adds ~35 min
    if (actions.imagingPathway === 'standard') {
        time += 35;
    } else if (actions.imagingPathway === 'direct-to-angio') {
        time -= 10; // Faster
    }

    // Large core may have technical difficulties
    if (actions.largeCoreStrategy === 'thrombectomy' && phenotype.coreInitial > 70) {
        time += 15; // More complex procedure
    }

    return Math.max(60, time);
}

/**
 * Compute reperfusion probability - ENHANCED from Python app.py
 * Now includes occlusion-specific base rates, collateral effects, core penalties, and scenario logic
 */
function computeReperfusionProbability(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    _time: number
): number {
    // Normalize occlusion type
    const occlusionType = normalizeOcclusion(phenotype.occlusion);
    const collaterals = phenotype.collaterals;
    const coreInitial = phenotype.coreInitial;

    // Base reperfusion probability by occlusion type (from Python)
    let rep = 0.82; // Default
    if (occlusionType === 'M2') {
        rep = 0.88; // Easier access
    } else if (occlusionType === 'M1') {
        rep = 0.84;
    } else if (occlusionType === 'ICA_T') {
        rep = 0.72; // More difficult
    } else if (occlusionType === 'TANDEM') {
        rep = 0.68; // Most difficult
    } else if (occlusionType === 'ICA') {
        rep = 0.75;
    }

    // Collateral adjustment (+/-2% per point from 2.0)
    rep += 0.02 * (collaterals - 2.0);

    // Core size penalty
    if (coreInitial > 70) {
        rep -= 0.08;
    } else if (coreInitial > 40) {
        rep -= 0.04;
    }

    // Technique bonus
    if (actions.imagingPathway === 'direct-to-angio') {
        rep += 0.03; // Direct angio technique
    }

    // IVT boost (bridging or drip-and-ship)
    const hasIVT = actions.treatmentStrategy === 'bridging' || actions.routingStrategy === 'drip-and-ship';
    if (hasIVT) {
        if (occlusionType === 'M2') {
            rep += 0.06;
        } else if (occlusionType === 'M1') {
            rep += 0.03;
        } else {
            rep += 0.01;
        }
    }

    // Scenario 4 (Tandem): Stenting bonus
    if (actions.tandemApproach === 'acute-stenting') {
        rep += 0.12; // Stent improves patency
    } else if (actions.tandemApproach === 'balloon-only') {
        rep -= 0.03; // Balloon less effective
    }

    // Scenario 5 (Large Core): Medical management = almost no reperfusion
    if (actions.largeCoreStrategy === 'medical') {
        rep = 0.05; // 5% spontaneous recanalization
    } else if (actions.largeCoreStrategy === 'thrombectomy' && coreInitial > 70) {
        rep -= 0.06; // Large core makes thrombectomy harder
    }

    // Scenario 6 (Wake-up): Mismatch strength affects outcomes
    const mismatchStr = phenotype.mismatchStrength || 'Moderate';
    if (actions.wakeUpStrategy === 'ivt-plus-evt' || actions.wakeUpStrategy === 'evt-alone') {
        if (mismatchStr === 'Strong') {
            rep += 0.02;
        } else if (mismatchStr === 'Mild') {
            rep -= 0.01;
        }
    }

    // Convert to percentage and clamp
    return clamp(rep * 100.0, 5, 98);
}

/**
 * Compute sICH (symptomatic intracranial hemorrhage) risk - ENHANCED from Python app.py
 * Now includes core-dependent baseline, IVT penalties, BP effects, and scenario-specific risks
 */
function computeSICHRisk(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    finalCore: number
): number {
    // Base sICH risk formula from Python: 3.5 + 0.09 * core_final
    let sich = 3.5 + 0.09 * finalCore;

    // IVT penalties (from Python)
    const hasIVT = actions.treatmentStrategy === 'bridging' || actions.routingStrategy === 'drip-and-ship';
    if (hasIVT) {
        sich += 4.0; // Base IVT penalty
        if (finalCore > 60) {
            sich += 2.5; // Additional penalty for IVT + large core
        }
    }

    // Blood pressure effect (from Python)
    const sbp = actions.sbpTarget ?? phenotype.systolicBP;
    if (sbp > 170) {
        sich += (sbp - 170) * 0.28; // Significant BP penalty
    }

    // Scenario 4 (Tandem): Acute stenting + DAPT dramatically increases bleeding
    if (actions.tandemApproach === 'acute-stenting') {
        sich += 9.0; // Major sICH risk from DAPT
    }

    // Scenario 5 (Large Core): Thrombectomy on large core increases risk
    if (actions.largeCoreStrategy === 'thrombectomy') {
        if (finalCore > 80) {
            sich += 6.0;
        } else {
            sich += 3.0;
        }
    }

    return clamp(sich, 1, 60);
}

/**
 * Compute mortality risk - ENHANCED from Python app.py
 * Formula: 4.0 + 0.13*core + 0.30*sICH + 0.22*max(0,age-60) + scenario adjustments
 */
function computeMortalityRisk(
    finalCore: number,
    sichRisk: number,
    phenotype: PatientPhenotype,
    actions: ActionParameters
): number {
    // Base mortality formula from Python
    let mortality = 4.0 + 0.13 * finalCore + 0.30 * sichRisk + 0.22 * Math.max(0, phenotype.age - 60);

    // Scenario 5 (Large Core): Medical management has very high mortality
    if (actions.largeCoreStrategy === 'medical') {
        mortality += 18.0; // No intervention = poor outcome
    }

    return clamp(mortality, 1, 95);
}

/**
 * Compute mRS 0-2 probability (good functional outcome) - ENHANCED from Python app.py
 * Formula: 84 - 0.55*core - 0.55*max(0,age-55) - 1.05*sICH + caps + scenario adjustments
 */
function computeMRS(
    finalCore: number,
    _reperfProb: number,
    sichRisk: number,
    phenotype: PatientPhenotype,
    actions: ActionParameters
): number {
    // Base mRS formula from Python
    let mrs = 84.0 - 0.55 * finalCore - 0.55 * Math.max(0, phenotype.age - 55) - 1.05 * sichRisk;

    // Core-size caps from Python (realistic outcome limits)
    if (finalCore > 80) {
        mrs = Math.min(mrs, 32.0); // Large core = poor max outcome
    } else if (finalCore > 60) {
        mrs = Math.min(mrs, 50.0);
    }

    // Scenario 6 (Wake-up): Mismatch strength affects salvageability
    const mismatchStr = phenotype.mismatchStrength || 'Moderate';
    if (actions.wakeUpStrategy === 'ivt-plus-evt' || actions.wakeUpStrategy === 'evt-alone') {
        if (mismatchStr === 'Strong') {
            mrs += 6.0; // More tissue to save
        } else if (mismatchStr === 'Mild') {
            mrs -= 5.0; // Less salvageable tissue
        }
    }

    // Scenario 5 (Large Core): Thrombectomy benefit is limited
    if (actions.largeCoreStrategy === 'thrombectomy') {
        mrs += 6.0; // Small benefit over medical management
    }

    return clamp(mrs, 0, 95);
}

/**
 * Monte Carlo simulation with aggregated results
 */
function simulateMonteCarlo(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    nRuns: number,
    _seed?: number
): SimulationResult {
    // Note: JavaScript doesn't have a built-in seeded random, so seed is ignored for now
    // Could use a seeded PRNG library if deterministic results are needed

    const results: SimulationResult[] = [];

    for (let i = 0; i < nRuns; i++) {
        results.push(simulateOnce(phenotype, actions, 'monte-carlo'));
    }

    return aggregateResults(results);
}

/**
 * Aggregate Monte Carlo results into percentiles
 */
function aggregateResults(results: SimulationResult[]): SimulationResult {
    const n = results.length;

    function getPercentiles(values: number[]): UncertaintyInterval {
        const sorted = [...values].sort((a, b) => a - b);
        return {
            p05: sorted[Math.floor(n * 0.05)],
            mean: Math.round(values.reduce((a, b) => a + b, 0) / n),
            p95: sorted[Math.floor(n * 0.95)],
        };
    }

    // Extract values for each metric
    const timeValues = results.map((r) => r.mediators.timeToReperfusion);
    const coreValues = results.map((r) => r.mediators.finalCoreVolume);
    const salvageValues = results.map((r) => r.mediators.penumbraSalvaged);
    const reperfValues = results.map((r) => r.mediators.reperfusionProbability);
    const sichValues = results.map((r) => r.outcomes.sichRisk);
    const mortValues = results.map((r) => r.outcomes.mortalityRisk);
    const mrsValues = results.map((r) => r.outcomes.mrs0to2Probability);

    const uncertainty: UncertaintyResults = {
        timeToReperfusion: getPercentiles(timeValues),
        finalCoreVolume: getPercentiles(coreValues),
        penumbraSalvaged: getPercentiles(salvageValues),
        reperfusionProbability: getPercentiles(reperfValues),
        sichRisk: getPercentiles(sichValues),
        mortalityRisk: getPercentiles(mortValues),
        mrs0to2Probability: getPercentiles(mrsValues),
    };

    // Use mean values for the main results
    const mediators: MediatorResults = {
        timeToReperfusion: uncertainty.timeToReperfusion.mean,
        finalCoreVolume: uncertainty.finalCoreVolume.mean,
        penumbraAtRisk: Math.round(results[0].mediators.penumbraAtRisk), // Same for all
        penumbraSalvaged: uncertainty.penumbraSalvaged.mean,
        reperfusionProbability: uncertainty.reperfusionProbability.mean,
    };

    const outcomes: OutcomeResults = {
        sichRisk: uncertainty.sichRisk.mean,
        mortalityRisk: uncertainty.mortalityRisk.mean,
        mrs0to2Probability: uncertainty.mrs0to2Probability.mean,
    };

    return { mediators, outcomes, uncertainty };
}
