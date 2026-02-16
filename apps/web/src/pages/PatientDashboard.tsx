
import { PATIENTS } from "../data/patientData";
import { Brain, Zap, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { PatientListTable } from "../components/dashboard/PatientListTable";

interface PatientDashboardProps {
    onSelectPatient: (patientId: string) => void;
}

export function PatientDashboard({ onSelectPatient }: PatientDashboardProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedScenario, setSelectedScenario] = useState<string | "all">("all");

    // Filter patients based on search and scenario
    const filteredPatients = useMemo(() => {
        return PATIENTS.filter(patient => {
            const matchesSearch =
                patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.patientId.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesScenario =
                selectedScenario === "all" ||
                patient.scenario === selectedScenario;

            return matchesSearch && matchesScenario;
        });
    }, [searchQuery, selectedScenario]);

    const scenarios = [
        { id: "all", label: "All Scenarios" },
        { id: "routing", label: "Routing" },
        { id: "bridging", label: "Bridging" },
        { id: "imaging", label: "Imaging" },
        { id: "tandem", label: "Tandem" },
        { id: "large-core", label: "Large Core" },
        { id: "wake-up", label: "Wake-Up" },
    ];

    return (
        <div className="min-h-screen bg-neuro-bg-primary">
            {/* Modernized Header */}
            <header className="relative min-h-[100px] px-8 py-6 border-b border-neuro-border-subtle bg-gradient-to-r from-neuro-bg-secondary via-neuro-bg-secondary to-neuro-salvaged/5 backdrop-blur-glass overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-neuro-salvaged/10 rounded-full blur-3xl" />
                </div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-neuro-salvaged/30 to-neuro-salvaged/10 flex items-center justify-center border border-neuro-salvaged/20 shadow-lg">
                            <Brain className="w-7 h-7 text-neuro-salvaged" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-neuro-salvaged rounded-full animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neuro-text-primary tracking-tight">NeuroSim</h1>
                            <p className="text-sm text-neuro-text-tertiary">Advanced Stroke Decision Support Platform</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-neuro-bg-tertiary/50 border border-neuro-border-subtle">
                            <Zap className="w-4 h-4 text-neuro-salvaged" />
                            <span className="text-sm text-neuro-text-secondary">{PATIENTS.length} Active Cases</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-8 py-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-neuro-text-primary mb-1 bg-gradient-to-r from-neuro-text-primary to-neuro-salvaged bg-clip-text text-transparent">
                            Patient Cases
                        </h2>
                        <p className="text-neuro-text-tertiary text-sm">Select a patient to begin simulation</p>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Input */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neuro-text-tertiary group-focus-within:text-neuro-salvaged transition-colors" />
                            <input
                                type="text"
                                placeholder="Search patient ID or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg bg-neuro-bg-tertiary/50 border border-neuro-border-subtle focus:border-neuro-salvaged/50 focus:ring-1 focus:ring-neuro-salvaged/50 outline-none w-64 text-sm text-neuro-text-primary placeholder:text-neuro-text-tertiary transition-all"
                            />
                        </div>

                        {/* Scenario Filter */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-4 w-4 text-neuro-text-tertiary" />
                            </div>
                            <select
                                value={selectedScenario}
                                onChange={(e) => setSelectedScenario(e.target.value)}
                                className="pl-9 pr-8 py-2 rounded-lg bg-neuro-bg-tertiary/50 border border-neuro-border-subtle focus:border-neuro-salvaged/50 focus:ring-1 focus:ring-neuro-salvaged/50 outline-none appearance-none text-sm text-neuro-text-primary cursor-pointer hover:bg-neuro-bg-tertiary transition-colors"
                            >
                                {scenarios.map((scenario) => (
                                    <option key={scenario.id} value={scenario.id}>
                                        {scenario.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Patient Table */}
                <PatientListTable
                    patients={filteredPatients}
                    onSelect={onSelectPatient}
                />
            </main>
        </div>
    );
}
