# NeuroSim - Stroke Simulation Dashboard

A high-fidelity, interactive clinical decision support simulation for acute ischemic stroke management. This application models patient outcomes based on time-sensitive interventions and physiological parameters.

> ✅ **Status**: Standalone Frontend Application (Client-side Simulation)

## 🚀 Features

- **Interactive Patient Dashboard**: View and select from 6 distinct clinical scenarios (e.g., Large Core, Wake-Up Stroke, Tandem Occlusion).
- **Real-time Simulation**: Client-side logic models the impact of treatment delays, blood pressure targets, and routing strategies on patient outcomes.
- **Dynamic Visualizations**:
  - **Time Sensitivity Curve**: Visualizes how delays affect functional independence (mRS 0-2).
  - **Causal Pathways**: Interactive DAGs showing relationships between interventions and outcomes.
  - **Tissue Fate Analysis**: Core vs. Penumbra evolution.
  - **Outcome Comparison**: Baseline vs. Current intervention scenarios.
- **Clinical Scenarios**:
  1. **Routing Strategy**: Drip-and-Ship vs. Mothership.
  2. **Bridging Therapy**: IVT + EVT vs. EVT Alone.
  3. **Imaging Selection**: Standard vs. Direct-to-Angio.
  4. **Tandem Lesions**: Acute Stenting vs. Balloon Angioplasty.
  5. **Large Core**: Thrombectomy vs. Medical Management.
  6. **Wake-Up Stroke**: Advanced Imaging Selection.

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Visualization**: Recharts
- **UI Components**: Radix UI + Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Turborepo (configured for single-package workspace)

## 📁 Project Structure

```
neurosim/
├── apps/
│   └── web/              # Main React Application
│       ├── src/
│       │   ├── components/   # UI & Dashboard Components
│       │   ├── data/        # Hardcoded Patient Scenarios
│       │   ├── lib/         # Simulation Engine & Utilities
│       │   ├── pages/       # Application Views
│       │   └── store/       # Zustand State Store
├── package.json          # Root dependencies
└── turbo.json           # Build configuration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **pnpm** 9+ (recommended) or npm/yarn

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```
   The application will run at `http://localhost:5173`.

### Building for Production
   ```bash
   pnpm build
   ```

## 🔬 Simulation Logic

The application uses a deterministic model (with optional Monte Carlo mode) to calculate:
- **Time to Reperfusion**: Based on routing, transfer delays, and procedure times.
- **Core Growth**: Modeled using collateral scores and time.
- **Outcomes**:
  - **mRS 0-2**: Probability of functional independence.
  - **sICH**: Risk of symptomatic intracranial hemorrhage.
  - **Mortality**: Risk of death based on core size, age, and complications.

## 📄 License

MIT
