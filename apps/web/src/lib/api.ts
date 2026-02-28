// API client for NeuroSim backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://neurosimapi-production.up.railway.app';

export interface Scenario {
    id: string;
    name: string;
    description: string | null;
    phenotype: {
        age: number;
        sex: 'M' | 'F';
        nihss: number;
        occlusion: string;
        occlusionType: string;
        collaterals: number;
        coreInitial: number;
        territory: number;
        mismatchStrength?: string;
        onsetTime: string;
        systolicBP: number;
    };
}

export interface SimulationRequest {
    scenarioId: string;
    phenotype: Scenario['phenotype'];
    actions: Record<string, any>;
    mode: 'deterministic' | 'monte-carlo';
    seed?: number;
    nRuns?: number;
}

export interface SimulationResponse {
    mediators: {
        timeToReperfusion: number;
        finalCoreVolume: number;
        penumbraAtRisk: number;
        penumbraSalvaged: number;
        reperfusionProbability: number;
    };
    outcomes: {
        sichRisk: number;
        mortalityRisk: number;
        mrs0to2Probability: number;
    };
    uncertainty?: any;
}

export interface ExplainRequest {
    scenarioId: string;
    scenarioName?: string;
    phenotype: {
        age: number;
        sex: string;
        nihss: number;
        occlusion: string;
        occlusionType?: string;
        collaterals: number;
        coreInitial?: number;
        territory?: number;
    };
    baselineActions?: Record<string, any>;
    currentActions?: Record<string, any>;
    baselineMediators?: {
        timeToReperfusion?: number;
        finalCoreVolume?: number;
        penumbraAtRisk?: number;
        penumbraSalvaged?: number;
        reperfusionProbability?: number;
    };
    currentMediators?: {
        timeToReperfusion?: number;
        finalCoreVolume?: number;
        penumbraAtRisk?: number;
        penumbraSalvaged?: number;
        reperfusionProbability?: number;
    };
    baselineOutcomes: {
        sichRisk: number;
        mortalityRisk: number;
        mrs0to2Probability: number;
    };
    currentOutcomes: {
        sichRisk: number;
        mortalityRisk: number;
        mrs0to2Probability: number;
    };
    explanationType: 'patient_facing' | 'clinical' | 'causal_mechanism';
}

export interface ExplainResponse {
    explanation: string;
    generatedAt: string;
    model: string;
}

export interface ChatRequest {
    history: { role: string; content: string }[];
    message: string;
    context: any;
}

export interface ChatResponse {
    response: string;
    generatedAt: string;
}

// API functions
export const api = {
    async getScenarios(): Promise<Scenario[]> {
        const response = await fetch(`${API_BASE_URL}/api/scenarios`);
        if (!response.ok) throw new Error('Failed to fetch scenarios');
        return response.json();
    },

    async getScenario(id: string): Promise<Scenario> {
        const response = await fetch(`${API_BASE_URL}/api/scenarios/${id}`);
        if (!response.ok) throw new Error(`Failed to fetch scenario ${id}`);
        return response.json();
    },

    async simulate(request: SimulationRequest): Promise<SimulationResponse> {
        const response = await fetch(`${API_BASE_URL}/api/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Simulation failed');
        return response.json();
    },

    async explain(request: ExplainRequest): Promise<ExplainResponse> {
        const response = await fetch(`${API_BASE_URL}/api/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Explanation failed');
        return response.json();
    },

    async chat(request: ChatRequest): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Chat failed');
        return response.json();
    },

    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
    },
};
