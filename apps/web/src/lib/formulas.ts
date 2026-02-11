// ===========================
// CLINICAL FORMULAS TEXT (For LLM Prompt)
// ===========================
export const CLINICAL_FORMULAS_TEXT = `
You are a precise stroke simulation engine. 
IMPORTANT: Round ALL numerical results to 2 decimal places.

Calculate the following dependent variables step-by-step.

INPUTS:
(provided in prompt)

FORMULAS:
1. timeToReperfusion (minutes):
   base = 120
   if routingStrategy == 'drip-and-ship': time = transferDelay + doorToGroinTime + ivtWorkflowDelay
   elif routingStrategy == 'direct-mothership': time = doorToGroinTime + 35
   if treatmentStrategy == 'bridging': time += ivtWorkflowDelay
   if imagingPathway == 'standard': time += 35
   elif imagingPathway == 'direct-to-angio': time -= 10
   if largeCoreStrategy == 'thrombectomy' and coreInitial > 70: time += 15
   result = max(60, time)

2. baseGrowthRate (cc/min):
   result = 0.18 + 0.14 * (2.5 - collaterals)
   clamp result to [0.12, 0.55]

3. fastProgressorMultipier:
   result = 0.85 + 0.9 * 0.28 (using mean value for deterministic calculation)

4. bpPenalty:
   sbp = sbpTarget if defined else systolicBP
   if collaterals < 1.5: (if sbp < 135 then 1.80 else 1.0)
   elif collaterals < 2.2: (if sbp < 125 then 1.45 else 1.0)
   else: (if sbp < 110 then 1.25 else 1.0)
   if sbp > 185 then result = 1.08
   default 1.0

5. finalCoreGrowth:
   result = timeToReperfusion * baseGrowthRate * fastProgressorMultipier * bpPenalty * 1.0

6. finalCore:
   result = clamp(coreInitial + finalCoreGrowth, 5, territory - 5)

7. reperfusionProbability (%):
   base based on occlusion: M2->88, M1->84, ICA->75, ICA_T->72, TANDEM->68, OTHER->82
   adjustments:
   + 2.0 * (collaterals - 2.0)
   if coreInitial > 70: -8; elif coreInitial > 40: -4
   if imagingPathway == 'direct-to-angio': +3
   if bridging/drip-and-ship: M2 +6, M1 +3, else +1
   tandem: acute-stenting +12, balloon-only -3
   large core: medical->5 (fixed), thrombectomy & core>70 -> -6
   wakeup: strong mismatch +2, mild -1
   result = clamp(base, 5, 98)

8. expectedSalvageFrac:
   baseSuccess = 0.78, baseFail = 0.10
   if imagingPathway == 'standard': baseSuccess += 0.03
   if wakeUpStrategy in ['ivt-plus-evt', 'evt-alone']:
       if mismatchStrength == 'Strong': baseSuccess += 0.06
       elif mismatchStrength == 'Mild': baseSuccess -= 0.04
   if coreInitial > 70: baseSuccess -= 0.18; baseFail = 0.05
   elif coreInitial > 40: baseSuccess -= 0.08
   baseSuccess = clamp(baseSuccess, 0.25, 0.90)
   baseFail = clamp(baseFail, 0.02, 0.20)
   p = reperfusionProbability / 100.0
   result = p * baseSuccess + (1 - p) * baseFail

8b. penumbraSalvaged (cc):
    penumbraAfterGrowth = max(0, territory - finalCore)
    result = max(0, penumbraAfterGrowth * expectedSalvageFrac)

9. sichRisk (%):
   base = 3.5 + 0.09 * finalCore
   IVT (bridging/drip-and-ship): +4.0. If finalCore > 60: +2.5 more.
   BP: if sbp > 170: + (sbp - 170) * 0.28
   tandem: acute-stenting + 9.0
   large core: thrombectomy -> if finalCore > 80: +6.0, else +3.0
   result = clamp(base, 1, 60)

10. mortalityRisk (%):
    result = 4.0 + 0.13 * finalCore + 0.30 * sichRisk + 0.22 * max(0, age - 60)
    if largeCoreStrategy == 'medical': result += 18.0
    result = clamp(result, 1, 95)

11. mrs0to2Probability (%):
    base = 84.0 - 0.55 * finalCore - 0.55 * max(0, age - 55) - 1.05 * sichRisk
    if finalCore > 80: base = min(base, 32)
    elif finalCore > 60: base = min(base, 50)
    wakeup: strong +6.0, mild -5.0
    large core: thrombectomy +6.0
    result = clamp(base, 0, 95)
`;
