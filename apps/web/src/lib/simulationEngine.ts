import type { PatientPhenotype, ActionParameters, SimulationResult, MediatorResults, OutcomeResults, UncertaintyResults } from './types';
import { CLINICAL_FORMULAS_TEXT } from './formulas';

interface SimulationOptions {
    mode: 'deterministic' | 'monte-carlo';
    seed?: number;
    nRuns?: number;
}

// ===========================
// CORE CLINICAL FORMULAS (LOCAL - ONLY FOR MONTE CARLO)
// ===========================

interface SimulationInternalResult {
    mediators: MediatorResults;
    outcomes: OutcomeResults;
}

/**
 * The core mathematical heart of the NeuroSim platform.
 * Used LOCALLY for Monte Carlo runs to avoid 200 API calls.
 */
function runCoreSimulationLocal(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    randomVars: { fastVal: number; growthNoise: number }
): SimulationInternalResult {
    const {
        age,
        collaterals,
        coreInitial,
        territory,
        occlusionType,
        systolicBP
    } = phenotype;

    const {
        routingStrategy,
        transferDelay = 0,
        doorToGroinTime = 60,
        ivtWorkflowDelay = 0,
        treatmentStrategy,
        imagingPathway,
        tandemApproach,
        largeCoreStrategy,
        wakeUpStrategy,
        mismatchStrength,
        sbpTarget
    } = actions;

    // 1. Time to Reperfusion (minutes)
    let time = 120;
    if (routingStrategy === 'drip-and-ship') {
        time = (transferDelay || 0) + (doorToGroinTime || 60) + (ivtWorkflowDelay || 0);
    } else if (routingStrategy === 'direct-mothership') {
        time = (doorToGroinTime || 60) + 35;
    }

    if (treatmentStrategy === 'bridging') time += (ivtWorkflowDelay || 0);
    if (imagingPathway === 'standard') time += 35;
    else if (imagingPathway === 'direct-to-angio') time -= 10;

    if (largeCoreStrategy === 'thrombectomy' && coreInitial > 70) time += 15;

    const timeToReperfusion = Math.max(60, time);

    // 2. Base Growth Rate
    let baseGrowthRate = 0.18 + 0.14 * (2.5 - collaterals);
    baseGrowthRate = Math.max(0.12, Math.min(0.55, baseGrowthRate));

    // 3. Multiplier
    const fastProgressorMultiplier = 0.85 + 0.9 * randomVars.fastVal;

    // 4. BP
    const sbp = sbpTarget ?? systolicBP;
    let bpPenalty = 1.0;
    if (collaterals < 1.5) {
        if (sbp < 135) bpPenalty = 1.80;
    } else if (collaterals < 2.2) {
        if (sbp < 125) bpPenalty = 1.45;
    } else {
        if (sbp < 110) bpPenalty = 1.25;
    }
    if (sbp > 185) bpPenalty = 1.08;

    // 5. Growth
    const finalCoreGrowth = timeToReperfusion * baseGrowthRate * fastProgressorMultiplier * bpPenalty * randomVars.growthNoise;

    // 6. Final Core
    const finalCore = Math.max(5, Math.min(territory - 5, coreInitial + finalCoreGrowth));

    // 7. Reperfusion Probability
    let reperfProb = 82;
    if (occlusionType === 'M2') reperfProb = 88;
    else if (occlusionType === 'M1') reperfProb = 84;
    else if (occlusionType === 'ICA') reperfProb = 75;
    else if (occlusionType === 'ICA_T') reperfProb = 72;
    else if (occlusionType === 'TANDEM') reperfProb = 68;

    reperfProb += 2.0 * (collaterals - 2.0);
    if (coreInitial > 70) reperfProb -= 8;
    else if (coreInitial > 40) reperfProb -= 4;

    if (imagingPathway === 'direct-to-angio') reperfProb += 3;
    if (treatmentStrategy === 'bridging' || routingStrategy === 'drip-and-ship') {
        if (occlusionType === 'M2') reperfProb += 6;
        else if (occlusionType === 'M1') reperfProb += 3;
        else reperfProb += 1;
    }

    if (occlusionType === 'TANDEM') {
        if (tandemApproach === 'acute-stenting') reperfProb += 12;
        else if (tandemApproach === 'balloon-only') reperfProb -= 3;
    }

    if (largeCoreStrategy === 'medical') reperfProb = 5;
    else if (largeCoreStrategy === 'thrombectomy' && coreInitial > 70) reperfProb -= 6;

    if (wakeUpStrategy === 'ivt-plus-evt') {
        if (mismatchStrength === 'strong') reperfProb += 2;
        else if (mismatchStrength === 'mild') reperfProb -= 1;
    }

    reperfProb = Math.max(5, Math.min(98, reperfProb));

    // 8. Salvage
    let baseSuccess = 0.78;
    let baseFail = 0.10;
    if (imagingPathway === 'standard') baseSuccess += 0.03;
    if (wakeUpStrategy === 'ivt-plus-evt' || wakeUpStrategy === 'evt-alone') {
        if (mismatchStrength === 'strong') baseSuccess += 0.06;
        else if (mismatchStrength === 'mild') baseSuccess -= 0.04;
    }
    if (coreInitial > 70) { baseSuccess -= 0.18; baseFail = 0.05; }
    else if (coreInitial > 40) { baseSuccess -= 0.08; }

    baseSuccess = Math.max(0.25, Math.min(0.90, baseSuccess));
    baseFail = Math.max(0.02, Math.min(0.20, baseFail));

    const p = reperfProb / 100.0;
    const expectedSalvageFrac = p * baseSuccess + (1 - p) * baseFail;
    const penumbraAfterGrowth = Math.max(0, territory - finalCore);
    const penumbraSalvaged = Math.max(0, penumbraAfterGrowth * expectedSalvageFrac);

    // 9. sICH
    let sichRisk = 3.5 + 0.09 * finalCore;
    if (treatmentStrategy === 'bridging' || routingStrategy === 'drip-and-ship') {
        sichRisk += 4.0;
        if (finalCore > 60) sichRisk += 2.5;
    }
    if (sbp > 170) sichRisk += (sbp - 170) * 0.28;
    if (tandemApproach === 'acute-stenting') sichRisk += 9.0;
    if (largeCoreStrategy === 'thrombectomy') {
        if (finalCore > 80) sichRisk += 6.0;
        else sichRisk += 3.0;
    }
    sichRisk = Math.max(1, Math.min(60, sichRisk));

    // 10. Mortality
    let mortalityRisk = 4.0 + 0.13 * finalCore + 0.30 * sichRisk + 0.22 * Math.max(0, age - 60);
    if (largeCoreStrategy === 'medical') mortalityRisk += 18.0;
    mortalityRisk = Math.max(1, Math.min(95, mortalityRisk));

    // 11. mRS 0-2
    let mrs0to2 = 84.0 - 0.55 * finalCore - 0.55 * Math.max(0, age - 55) - 1.05 * sichRisk;
    if (finalCore > 80) mrs0to2 = Math.min(mrs0to2, 32);
    else if (finalCore > 60) mrs0to2 = Math.min(mrs0to2, 50);

    if (wakeUpStrategy === 'ivt-plus-evt' || wakeUpStrategy === 'evt-alone') {
        if (mismatchStrength === 'strong') mrs0to2 += 6.0;
        else if (mismatchStrength === 'mild') mrs0to2 -= 5.0;
    }
    if (largeCoreStrategy === 'thrombectomy') mrs0to2 += 6.0;
    mrs0to2 = Math.max(0, Math.min(95, mrs0to2));

    return {
        mediators: {
            timeToReperfusion: Math.round(timeToReperfusion),
            finalCoreVolume: Math.round(finalCore),
            penumbraAtRisk: Math.round(Math.max(0, territory - coreInitial)),
            penumbraSalvaged: Math.round(penumbraSalvaged),
            reperfusionProbability: Math.round(reperfProb),
        },
        outcomes: {
            sichRisk: Math.round(sichRisk),
            mortalityRisk: Math.round(mortalityRisk),
            mrs0to2Probability: Math.round(mrs0to2),
        }
    };
}

// ===========================
// STOCHASTIC UTILITIES
// ===========================

function sampleNormal(mean: number, std: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + std * z;
}

function sampleBeta25(): number {
    const g2 = -Math.log(Math.random()) - Math.log(Math.random());
    const g5 = -Math.log(Math.random()) - Math.log(Math.random()) - Math.log(Math.random()) - Math.log(Math.random()) - Math.log(Math.random());
    return g2 / (g2 + g5);
}

// ===========================
// PUBLIC SIMULATION ENGINE
// ===========================

/**
 * Main simulation function.
 * Deterministic runs go to the LLM.
 * Monte Carlo runs stay local block.
 */
export async function simulatePathway(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    options: SimulationOptions
): Promise<SimulationResult> {

    if (options.mode === 'deterministic') {
        // CALL THE LLM FOR DETERMINISTIC
        const prompt = `Calculate the clinical outcomes for a stroke patient.
        INPUTS: ${JSON.stringify({ ...phenotype, ...actions })}
        
        ${CLINICAL_FORMULAS_TEXT}
        
        OUTPUT: Return ONLY a JSON object with:
        - mediators: { timeToReperfusion, finalCoreVolume, penumbraSalvaged, reperfusionProbability, penumbraAtRisk }
        - outcomes: { sichRisk, mortalityRisk, mrs0to2Probability }
        `;

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API Error: ${response.status} ${text}`);
            }

            const data = await response.json();
            return data.result as SimulationResult;
        } catch (e) {
            console.error("LLM Calculation failed, falling back to local", e);
            // Fallback to local
            return runCoreSimulationLocal(phenotype, actions, { fastVal: 0.28, growthNoise: 1.0 }) as unknown as SimulationResult;
        }
    }

    // Monte Carlo Mode (200 runs) - STAY LOCAL
    const nRuns = options.nRuns ?? 200;
    const runs: SimulationInternalResult[] = [];

    for (let i = 0; i < nRuns; i++) {
        const fastVal = sampleBeta25();
        const growthNoise = Math.max(0.5, Math.min(1.5, sampleNormal(1.0, 0.16)));
        runs.push(runCoreSimulationLocal(phenotype, actions, { fastVal, growthNoise }));
    }

    const aggregate = (path: 'mediators' | 'outcomes', key: string) => {
        const vals = runs.map(r => (r[path] as any)[key]).sort((a, b) => a - b);
        const mean = vals.reduce((a, b) => a + b, 0) / nRuns;
        const p05 = vals[Math.floor(nRuns * 0.05)];
        const p95 = vals[Math.floor(nRuns * 0.95)];
        return { p05: Math.round(p05), mean: Math.round(mean), p95: Math.round(p95) };
    };

    const uncertainty: UncertaintyResults = {
        timeToReperfusion: aggregate('mediators', 'timeToReperfusion'),
        finalCoreVolume: aggregate('mediators', 'finalCoreVolume'),
        penumbraSalvaged: aggregate('mediators', 'penumbraSalvaged'),
        reperfusionProbability: aggregate('mediators', 'reperfusionProbability'),
        sichRisk: aggregate('outcomes', 'sichRisk'),
        mortalityRisk: aggregate('outcomes', 'mortalityRisk'),
        mrs0to2Probability: aggregate('outcomes', 'mrs0to2Probability'),
    };

    return {
        mediators: {
            timeToReperfusion: uncertainty.timeToReperfusion.mean,
            finalCoreVolume: uncertainty.finalCoreVolume.mean,
            penumbraAtRisk: runs[0].mediators.penumbraAtRisk,
            penumbraSalvaged: uncertainty.penumbraSalvaged.mean,
            reperfusionProbability: uncertainty.reperfusionProbability.mean,
        },
        outcomes: {
            sichRisk: uncertainty.sichRisk.mean,
            mortalityRisk: uncertainty.mortalityRisk.mean,
            mrs0to2Probability: uncertainty.mrs0to2Probability.mean,
        },
        uncertainty
    };
}

/**
 * Calculates scenarios for time sensitivity graphs.
 * GOES TO THE LLM (Batch).
 */
export async function calculateScenarios(
    scenarios: Array<{
        id: string | number;
        phenotype: PatientPhenotype;
        actions: ActionParameters;
    }>
): Promise<Array<{ id: string | number; result: any }>> {
    const prompt = `Calculate the clinical outcomes for MULTIPLE stroke scenarios.
    SCENARIOS: ${JSON.stringify(scenarios)}
    
    ${CLINICAL_FORMULAS_TEXT}

    OUTPUT: Return ONLY a JSON object with a "results" array.
    Each item in "results" must have:
    - id: string | number
    - result: {
        mediators: { timeToReperfusion, finalCoreVolume, penumbraSalvaged, reperfusionProbability },
        outcomes: { sichRisk, mortalityRisk, mrs0to2Probability }
    }
    `;

    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.result.results;
    } catch (e) {
        console.error("Batch Calculation failed", e);
        // Fallback to local batch
        return scenarios.map(s => ({
            id: s.id,
            result: runCoreSimulationLocal(s.phenotype, s.actions, { fastVal: 0.28, growthNoise: 1.0 })
        }));
    }
}

export async function calculateMonteCarloStats(
    phenotype: PatientPhenotype,
    actions: ActionParameters,
    nRuns: number = 200
): Promise<SimulationResult> {
    return simulatePathway(phenotype, actions, { mode: 'monte-carlo', nRuns });
}
