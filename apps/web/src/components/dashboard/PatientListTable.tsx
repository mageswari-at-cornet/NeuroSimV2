import type { Patient } from "../../data/patientData";
import { cn } from "../../lib/utils";
import {
    User,
    Activity,
    AlertTriangle,
    Clock,
    ArrowRight
} from "lucide-react";

interface PatientListTableProps {
    patients: Patient[];
    onSelect: (patientId: string) => void;
}

export function PatientListTable({ patients, onSelect }: PatientListTableProps) {
    if (patients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center glass-panel">
                <User className="w-12 h-12 text-neuro-text-tertiary mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-neuro-text-secondary">No patients found</h3>
                <p className="text-sm text-neuro-text-tertiary">Try adjusting your filters</p>
            </div>
        );
    }

    const getScenarioColor = (scenario: string) => {
        switch (scenario) {
            case "routing": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case "bridging": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
            case "imaging": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
            case "tandem": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
            case "large-core": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "wake-up": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
            default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
        }
    };

    const getScenarioLabel = (scenario: string) => {
        switch (scenario) {
            case "routing": return "Routing";
            case "bridging": return "Bridging";
            case "imaging": return "Imaging";
            case "tandem": return "Tandem";
            case "large-core": return "Large Core";
            case "wake-up": return "Wake-Up";
            default: return scenario;
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-neuro-border-subtle bg-neuro-bg-secondary/30 backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neuro-border-subtle bg-neuro-bg-tertiary/50">
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider">ID / Patient</th>
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider">Scenario</th>
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider">Clinical Status</th>
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider">Occlusion / Core</th>
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider text-center">Collaterals</th>
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider">Onset</th>
                            <th className="py-4 px-6 text-xs font-semibold text-neuro-text-tertiary uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neuro-border-subtle/50">
                        {patients.map((patient, index) => (
                            <tr
                                key={patient.id}
                                onClick={() => onSelect(patient.id)}
                                className={cn(
                                    "group cursor-pointer transition-colors duration-200",
                                    "hover:bg-neuro-bg-tertiary/60"
                                )}
                                style={{
                                    animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                                }}
                            >
                                {/* Patient Info */}
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs text-neuro-text-tertiary mb-1">
                                            {patient.patientId}
                                        </span>
                                        <span className="font-medium text-neuro-text-primary group-hover:text-neuro-salvaged transition-colors">
                                            {patient.name}
                                        </span>
                                        <span className="text-xs text-neuro-text-secondary mt-1">
                                            {patient.data.age}y / {patient.data.sex}
                                        </span>
                                    </div>
                                </td>

                                {/* Scenario */}
                                <td className="py-4 px-6">
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                                        getScenarioColor(patient.scenario)
                                    )}>
                                        {getScenarioLabel(patient.scenario)}
                                    </span>
                                </td>

                                {/* NIHSS / Status */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-neuro-text-tertiary" />
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-neuro-text-tertiary">NIHSS:</span>
                                                <span className={cn(
                                                    "font-bold",
                                                    patient.data.nihss >= 15 ? "text-neuro-core" :
                                                        patient.data.nihss >= 8 ? "text-neuro-penumbra" :
                                                            "text-neuro-salvaged"
                                                )}>
                                                    {patient.data.nihss}
                                                </span>
                                            </div>
                                            <span className="text-xs text-neuro-text-secondary">
                                                BP: {patient.data.systolicBP}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Occlusion / Core */}
                                <td className="py-4 px-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-neuro-text-primary">
                                            <AlertTriangle className="w-3.5 h-3.5 text-neuro-text-tertiary" />
                                            {patient.data.occlusionLocation}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-neuro-text-secondary">
                                            <span>Core:</span>
                                            <span className={cn(
                                                "font-semibold",
                                                patient.data.initialCoreVolume > 70 ? "text-neuro-core" : "text-neuro-text-primary"
                                            )}>
                                                {patient.data.initialCoreVolume} cc
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Collaterals */}
                                <td className="py-4 px-6 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full border bg-neuro-bg-tertiary font-bold text-sm",
                                            patient.data.collateralScore < 2 ? "text-neuro-penumbra border-neuro-penumbra/30" : "text-neuro-salvaged border-neuro-salvaged/30"
                                        )}>
                                            {patient.data.collateralScore}
                                        </div>
                                    </div>
                                </td>

                                {/* Onset */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2 text-neuro-text-secondary">
                                        <Clock className="w-4 h-4 text-neuro-text-tertiary" />
                                        <span className="text-sm">
                                            {patient.data.onsetTime === "wake-up" ? "Unknown" : patient.data.onsetTime.replace(" ago", "")}
                                        </span>
                                    </div>
                                </td>

                                {/* Action */}
                                <td className="py-4 px-6 text-right">
                                    <button className="p-2 rounded-lg bg-neuro-bg-tertiary hover:bg-neuro-salvaged/20 text-neuro-text-secondary hover:text-neuro-salvaged transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
