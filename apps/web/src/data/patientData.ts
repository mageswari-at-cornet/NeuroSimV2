import type { PatientData, Scenario } from "../types/dashboard";

export interface Patient {
  id: string;
  name: string;
  patientId: string;
  scenario: Scenario;
  data: PatientData;
  description: string;
}

export const PATIENTS: Patient[] = [
  {
    id: "P1",
    name: "Robert Chen",
    patientId: "NS-2026-0042",
    scenario: "routing",
    description: "Drip-and-Ship vs Direct Mothership. Moderate collaterals.",
    data: {
      age: 72,
      sex: "M",
      nihss: 18,
      occlusionLocation: "Left M1",
      collateralScore: 1.5,
      initialCoreVolume: 25,
      territoryAtRisk: 150,
      systolicBP: 150,
      onsetTime: "2h 14m ago",
    },
  },
  {
    id: "P2",
    name: "Maria Rodriguez",
    patientId: "NS-2026-0043",
    scenario: "bridging",
    description: "IV tPA + EVT vs EVT Alone. Good collaterals.",
    data: {
      age: 58,
      sex: "F",
      nihss: 14,
      occlusionLocation: "Proximal M1",
      collateralScore: 2.5,
      initialCoreVolume: 10,
      territoryAtRisk: 150,
      systolicBP: 145,
      onsetTime: "1h 45m ago",
    },
  },
  {
    id: "P3",
    name: "James Wilson",
    patientId: "NS-2026-0044",
    scenario: "imaging",
    description: "Bypass CT Perfusion vs Standard Imaging. Very poor collaterals.",
    data: {
      age: 65,
      sex: "M",
      nihss: 20,
      occlusionLocation: "ICA Terminus",
      collateralScore: 0.5,
      initialCoreVolume: 40,
      territoryAtRisk: 150,
      systolicBP: 160,
      onsetTime: "3h 10m ago",
    },
  },
  {
    id: "P4",
    name: "David Kim",
    patientId: "NS-2026-0045",
    scenario: "tandem",
    description: "Acute stent (DAPT bleed risk) vs Balloon-only (re-occlusion risk).",
    data: {
      age: 62,
      sex: "M",
      nihss: 15,
      occlusionLocation: "ICA + M1",
      collateralScore: 2.0,
      initialCoreVolume: 15,
      territoryAtRisk: 150,
      systolicBP: 150,
      onsetTime: "2h 30m ago",
    },
  },
  {
    id: "P5",
    name: "Jennifer Adams",
    patientId: "NS-2026-0046",
    scenario: "large-core",
    description: "Treating a massive core. Smaller benefit, higher harm, but may reduce worst outcomes.",
    data: {
      age: 50,
      sex: "F",
      nihss: 22,
      occlusionLocation: "Proximal M1",
      collateralScore: 1.0,
      initialCoreVolume: 90,
      territoryAtRisk: 150,
      systolicBP: 155,
      onsetTime: "4h 00m ago",
    },
  },
  {
    id: "P6",
    name: "Thomas Lee",
    patientId: "NS-2026-0047",
    scenario: "wake-up",
    description: "Unknown time. MRI mismatch strength guides IV tPA decision.",
    data: {
      age: 70,
      sex: "M",
      nihss: 12,
      occlusionLocation: "M2",
      collateralScore: 2.0,
      initialCoreVolume: 30,
      territoryAtRisk: 150,
      systolicBP: 150,
      onsetTime: "wake-up",
    },
  },
];

export function getPatientById(id: string): Patient | undefined {
  return PATIENTS.find((patient) => patient.id === id);
}

export function getDefaultPatient(): Patient {
  return PATIENTS[0];
}
