import { PATIENTS } from "../data/patientData";
import { Brain, User, Activity, Clock, AlertTriangle, Heart, ArrowRight, Zap } from "lucide-react";
import { cn } from "../lib/utils";

interface PatientDashboardProps {
    onSelectPatient: (patientId: string) => void;
}

export function PatientDashboard({ onSelectPatient }: PatientDashboardProps) {
    const getScenarioColor = (scenario: string) => {
        switch (scenario) {
            case "routing":
                return "from-blue-500/20 to-blue-600/10 border-blue-500/30";
            case "bridging":
                return "from-purple-500/20 to-purple-600/10 border-purple-500/30";
            case "imaging":
                return "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30";
            case "tandem":
                return "from-orange-500/20 to-orange-600/10 border-orange-500/30";
            case "large-core":
                return "from-red-500/20 to-red-600/10 border-red-500/30";
            case "wake-up":
                return "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30";
            default:
                return "from-gray-500/20 to-gray-600/10 border-gray-500/30";
        }
    };

    const getScenarioLabel = (scenario: string) => {
        switch (scenario) {
            case "routing":
                return "Patient Routing";
            case "bridging":
                return "Bridging Therapy";
            case "imaging":
                return "Imaging Pathway";
            case "tandem":
                return "Tandem Lesion";
            case "large-core":
                return "Large Core";
            case "wake-up":
                return "Wake-Up Stroke";
            default:
                return scenario;
        }
    };

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

                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-neuro-bg-tertiary/50 border border-neuro-border-subtle">
                        <Zap className="w-4 h-4 text-neuro-salvaged" />
                        <span className="text-sm text-neuro-text-secondary">{PATIENTS.length} Active Cases</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-8 py-10">
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-neuro-text-primary mb-3 bg-gradient-to-r from-neuro-text-primary to-neuro-salvaged bg-clip-text text-transparent">
                        Patient Cases
                    </h2>

                </div>

                {/* Modernized Patient Cards - Horizontal Layout */}
                <div className="space-y-4">
                    {PATIENTS.map((patient, index) => (
                        <button
                            key={patient.id}
                            onClick={() => onSelectPatient(patient.id)}
                            className={cn(
                                "group w-full relative overflow-hidden",
                                "glass-panel p-6 text-left",
                                "hover:bg-neuro-bg-tertiary/50 transition-all duration-300",
                                "hover:scale-[1.01] active:scale-[0.99]",
                                "border-l-4",
                                index % 2 === 0 ? "border-l-neuro-salvaged" : "border-l-neuro-penumbra"
                            )}
                            style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                            }}
                        >
                            {/* Gradient overlay */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                getScenarioColor(patient.scenario)
                            )} />

                            <div className="relative flex items-center gap-6">
                                {/* Left: Patient Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-neuro-bg-tertiary/70">
                                            <User className="w-3 h-3 text-neuro-text-tertiary" />
                                            <span className="text-xs text-neuro-text-tertiary font-mono">
                                                {patient.patientId}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium uppercase border backdrop-blur-sm",
                                            patient.scenario === "routing" && "bg-blue-500/20 text-blue-400 border-blue-500/40",
                                            patient.scenario === "bridging" && "bg-purple-500/20 text-purple-400 border-purple-500/40",
                                            patient.scenario === "imaging" && "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
                                            patient.scenario === "tandem" && "bg-orange-500/20 text-orange-400 border-orange-500/40",
                                            patient.scenario === "large-core" && "bg-red-500/20 text-red-400 border-red-500/40",
                                            patient.scenario === "wake-up" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                                        )}>
                                            {getScenarioLabel(patient.scenario)}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-neuro-text-primary mb-1 group-hover:text-neuro-salvaged transition-colors">
                                        {patient.name}
                                    </h3>

                                    {/* Condensed Clinical Data */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-neuro-text-secondary">Age:</span>
                                            <span className="text-sm font-semibold text-neuro-text-primary">{patient.data.age}</span>
                                        </div>
                                        <div className="h-3 w-px bg-neuro-border-subtle" />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-neuro-text-secondary">Sex:</span>
                                            <span className="text-sm font-semibold text-neuro-text-primary">{patient.data.sex}</span>
                                        </div>
                                        <div className="h-3 w-px bg-neuro-border-subtle" />
                                        <div className="flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-neuro-text-tertiary" />
                                            <span className="text-xs text-neuro-text-secondary">NIHSS:</span>
                                            <span className={cn(
                                                "text-sm font-bold",
                                                patient.data.nihss >= 15 ? "text-neuro-core" :
                                                    patient.data.nihss >= 8 ? "text-neuro-penumbra" :
                                                        "text-neuro-salvaged"
                                            )}>{patient.data.nihss}</span>
                                        </div>
                                        <div className="h-3 w-px bg-neuro-border-subtle" />
                                        <div className="flex items-center gap-1.5">
                                            <AlertTriangle className="w-3 h-3 text-neuro-text-tertiary" />
                                            <span className="text-xs text-neuro-text-secondary">{patient.data.occlusionLocation}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Key Metrics */}
                                <div className="flex items-center gap-4">
                                    <div className="text-center px-4 py-3 rounded-lg bg-neuro-bg-tertiary/70 border border-neuro-border-subtle min-w-[90px]">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Brain className="w-3 h-3 text-neuro-text-tertiary" />
                                            <span className="text-xs text-neuro-text-secondary">Core</span>
                                        </div>
                                        <div className={cn(
                                            "text-xl font-bold",
                                            patient.data.initialCoreVolume > 70 ? "text-neuro-core" : "text-neuro-text-primary"
                                        )}>
                                            {patient.data.initialCoreVolume}
                                            <span className="text-xs ml-0.5">cc</span>
                                        </div>
                                    </div>

                                    <div className="text-center px-4 py-3 rounded-lg bg-neuro-bg-tertiary/70 border border-neuro-border-subtle min-w-[90px]">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Heart className="w-3 h-3 text-neuro-text-tertiary" />
                                            <span className="text-xs text-neuro-text-secondary">Collat.</span>
                                        </div>
                                        <div className={cn(
                                            "text-xl font-bold",
                                            patient.data.collateralScore < 2 ? "text-neuro-penumbra" : "text-neuro-text-primary"
                                        )}>
                                            {patient.data.collateralScore}
                                        </div>
                                    </div>

                                    <div className="text-center px-4 py-3 rounded-lg bg-neuro-bg-tertiary/70 border border-neuro-border-subtle min-w-[90px]">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Clock className="w-3 h-3 text-neuro-text-tertiary" />
                                            <span className="text-xs text-neuro-text-secondary">Onset</span>
                                        </div>
                                        <div className="text-sm font-semibold text-neuro-text-primary truncate">
                                            {patient.data.onsetTime === "wake-up" ? "Unknown" : patient.data.onsetTime.replace(" ago", "")}
                                        </div>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div className="ml-2 w-10 h-10 rounded-full bg-neuro-salvaged/10 flex items-center justify-center group-hover:bg-neuro-salvaged/20 transition-colors">
                                        <ArrowRight className="w-5 h-5 text-neuro-salvaged group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}
