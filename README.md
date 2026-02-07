# NeuroSim - Turborepo TypeScript Monorepo

A full-stack stroke simulation application built with **Turborepo**, **TypeScript**, **React**, **Hono**, and **PostgreSQL**.

> ✅ **Status**: Backend API running, database connected, frontend ready for integration

## 📁 Project Structure

```
neurosim/
├── apps/
│   ├── web/              # React + Vite frontend (port 5174)
│   └── api/              # Hono backend (port 3001)
├── packages/
│   ├── db/               # Drizzle ORM + PostgreSQL
│   ├── simulation/       # Shared simulation logic
│   └── types/            # Shared TypeScript types
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspaces
└── .env                  # Environment variables
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **PostgreSQL** 16+ ([Installation Guide](https://www.postgresql.org/download/))

### Installation

1. **Clone and install dependencies**
```bash
cd neurosim
pnpm install
```

2. **Set up environment variables**
```bash
# Root .env file
DATABASE_URL=postgresql://mageswari:open%20the%20door@localhost:5432/neurosim
GEMINI_API_KEY=your-gemini-api-key-here  # Optional
PORT=3001

# apps/web/.env file
VITE_API_URL=http://localhost:3001
```

3. **Create database** (if not exists)
```bash
createdb neurosim
```

4. **Push database schema**
```bash
DATABASE_URL="postgresql://mageswari:open%20the%20door@localhost:5432/neurosim" pnpm --filter=@neurosim/db db:push
```

5. **Seed scenarios**
```bash
pnpm --filter=@neurosim/db db:seed
```

6. **Start development servers**
```bash
pnpm dev
```

## 🔗 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5174 | React dashboard |
| API | http://localhost:3001 | Hono backend |
| Health Check | http://localhost:3001/health | API status |
| Scenarios | http://localhost:3001/api/scenarios | List all scenarios |

## 📦 Packages

### `@neurosim/web`
React frontend with Vite, Zustand, Radix UI, Recharts, and Tailwind CSS.
- **Tech**: React 19, Vite, TypeScript, Zustand, Tailwind CSS
- **Features**: Real-time simulation, interactive charts, AI explanations

### `@neurosim/api`
Hono backend with routes for scenarios, simulation, and AI explanations.
- **Tech**: Hono, Node.js, TypeScript
- **Routes**: `/api/scenarios`, `/api/simulate`, `/api/explain`

### `@neurosim/db`
Database package with Drizzle ORM schema and seed data for 6 clinical scenarios.
- **Tech**: Drizzle ORM, PostgreSQL, postgres.js
- **Data**: 6 clinical scenarios (S1-S6)

### `@neurosim/simulation`
Shared simulation logic for stroke pathway calculations (deterministic + Monte Carlo).
- **Modes**: Deterministic, Monte Carlo (200 runs)
- **Outputs**: Mediators (time, core volume) + Outcomes (sICH, mortality, mRS)

### `@neurosim/types`
Shared TypeScript types used across frontend and backend.
- **Types**: `Scenario`, `PatientPhenotype`, `SimulationResult`, etc.

## 🗄️ Database

### Schema
```sql
scenarios (
  id VARCHAR(10) PRIMARY KEY,  -- 'S1' to 'S6'
  name VARCHAR(100),
  description TEXT,
  -- Patient phenotype fields
  age INTEGER,
  sex VARCHAR(10),
  nihss INTEGER,
  occlusion VARCHAR(50),
  occlusion_type VARCHAR(20),
  collaterals DECIMAL(3,2),
  core_initial DECIMAL(5,2),
  territory DECIMAL(5,2),
  mismatch_strength VARCHAR(20),
  onset_time VARCHAR(50),
  systolic_bp INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Drizzle Commands
```bash
pnpm --filter=@neurosim/db db:push      # Push schema to database
pnpm --filter=@neurosim/db db:seed      # Seed 6 scenarios
pnpm --filter=@neurosim/db db:studio    # Open Drizzle Studio (GUI)
```

## 🧪 API Endpoints

### `GET /health`
Health check endpoint
```bash
curl http://localhost:3001/health
```

### `GET /api/scenarios`
List all 6 clinical scenarios
```bash
curl http://localhost:3001/api/scenarios | jq
```

### `GET /api/scenarios/:id`
Get single scenario (S1-S6)
```bash
curl http://localhost:3001/api/scenarios/S1 | jq
```

### `POST /api/simulate`
Run simulation with patient phenotype and actions

**Request:**
```json
{
  "scenarioId": "S1",
  "phenotype": {
    "age": 72,
    "sex": "M",
    "nihss": 18,
    "occlusion": "Left M1",
    "occlusionType": "M1",
    "collaterals": 1.5,
    "coreInitial": 25,
    "territory": 150,
    "onsetTime": "2h 14m ago",
    "systolicBP": 150
  },
  "actions": {
    "routingStrategy": "drip-and-ship",
    "transferDelay": 45,
    "doorToGroinTime": 60,
    "sbpTarget": 140
  },
  "mode": "deterministic"
}
```

**Response:**
```json
{
  "mediators": {
    "timeToReperfusion": 113,
    "finalCoreVolume": 29,
    "penumbraAtRisk": 125,
    "penumbraSalvaged": 121,
    "reperfusionProbability": 90
  },
  "outcomes": {
    "sichRisk": 5,
    "mortalityRisk": 21,
    "mrs0to2Probability": 50
  }
}
```

**Test it:**
```bash
curl -X POST http://localhost:3001/api/simulate \
  -H "Content-Type: application/json" \
  -d @test-simulate.json | jq
```

### `POST /api/explain`
Generate AI explanation using Gemini (requires `GEMINI_API_KEY`)

**Request:**
```json
{
  "scenarioId": "S1",
  "phenotype": { "age": 72, "sex": "M", "nihss": 18, "occlusion": "Left M1", "collaterals": 1.5 },
  "baselineActions": {},
  "currentActions": { "routingStrategy": "drip-and-ship" },
  "baselineOutcomes": { "sichRisk": 5, "mortalityRisk": 20, "mrs0to2Probability": 45 },
  "currentOutcomes": { "sichRisk": 5, "mortalityRisk": 21, "mrs0to2Probability": 50 },
  "explanationType": "patient_facing"
}
```

## 🔧 Frontend Integration

Use the API client in your React components:

```typescript
import { api } from '@/lib/api';

// Fetch scenarios
const scenarios = await api.getScenarios();

// Run simulation
const result = await api.simulate({
  scenarioId: 'S1',
  phenotype: scenario.phenotype,
  actions: { routingStrategy: 'drip-and-ship' },
  mode: 'deterministic',
});

// Generate explanation
const explanation = await api.explain({
  scenarioId: 'S1',
  phenotype,
  baselineActions,
  currentActions,
  baselineOutcomes,
  currentOutcomes,
  explanationType: 'patient_facing',
});
```

## 🔑 Environment Variables

### Root `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/neurosim
GEMINI_API_KEY=your-gemini-api-key-here  # Optional for AI
PORT=3001
```

### `apps/web/.env`
```env
VITE_API_URL=http://localhost:3001
```

## 🏗️ Built With

| Technology | Purpose |
|------------|---------|
| **Turborepo** | Monorepo build system with caching |
| **TypeScript** | End-to-end type safety |
| **React 19** | Frontend UI framework |
| **Vite** | Fast frontend build tool |
| **Hono** | Lightweight backend framework |
| **Drizzle ORM** | Type-safe SQL toolkit |
| **PostgreSQL** | Relational database |
| **Gemini AI** | LLM for clinical explanations |
| **Zustand** | State management |
| **Recharts** | Data visualization |
| **Tailwind CSS** | Utility-first CSS |

## 🛠️ Development

### Build all packages
```bash
pnpm build
```

### Lint code
```bash
pnpm lint
```

### Clean build artifacts
```bash
rm -rf apps/*/dist packages/*/dist .turbo
```

## 🚨 Troubleshooting

### API not connecting to database
- Verify PostgreSQL is running: `psql -l`
- Check DATABASE_URL in `.env`
- Ensure database exists: `createdb neurosim`

### Frontend not connecting to API
- Check `VITE_API_URL` in `apps/web/.env`
- Verify API is running: `curl http://localhost:3001/health`
- Check CORS settings in `apps/api/src/index.ts`

### Turbo cache issues
```bash
pnpm run build --force
```

## 📝 Next Steps

- [ ] Add Gemini API key for AI explanations
- [ ] Update frontend store to use backend APIs
- [ ] Add authentication (optional)
- [ ] Deploy to production (Vercel + Railway/Fly.io)
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD with GitHub Actions

## 📄 License

MIT

---

**Made with ❤️ using Turborepo + TypeScript**
