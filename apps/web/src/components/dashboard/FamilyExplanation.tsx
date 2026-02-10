import { useState } from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { Users, Copy, Check, RefreshCw, MessageCircle } from "lucide-react";

interface FamilyExplanationProps {
  className?: string;
}

export function FamilyExplanation({ className }: FamilyExplanationProps) {
  const { activeScenario, patientData, currentOutcomes, simulationParams } = useDashboardStore();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);



  const generateExplanation = async () => {
    setIsGenerating(true);
    setExplanation(null);

    try {
      const result = await api.explain({
        scenarioId: activeScenario,
        explanationType: 'patient_facing',
        phenotype: {
          age: patientData.age,
          sex: patientData.sex,
          nihss: patientData.nihss,
          occlusion: patientData.occlusionLocation,
          collaterals: patientData.collateralScore,
          coreInitial: patientData.initialCoreVolume,
          territory: patientData.territoryAtRisk,
        },
        baselineOutcomes: {
          sichRisk: 0,
          mortalityRisk: 0,
          mrs0to2Probability: 0
        },
        currentOutcomes: {
          sichRisk: currentOutcomes.sichRisk,
          mortalityRisk: currentOutcomes.mortalityRisk,
          mrs0to2Probability: currentOutcomes.mrs0to2Probability
        },
        currentActions: simulationParams
      });
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Failed to generate explanation:", error);
      setExplanation("I apologize, but I am unable to generate an explanation at this moment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neuro-text-primary flex items-center gap-2">
          <Users className="w-4 h-4 text-neuro-salvaged" />
          Family Explanation
        </h3>
        {!explanation ? (
          <button
            onClick={generateExplanation}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-neuro-salvaged/20 text-neuro-salvaged hover:bg-neuro-salvaged/30 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <MessageCircle className="w-3 h-3" />
                Generate
              </>
            )}
          </button>
        ) : (
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-neuro-bg-tertiary text-neuro-text-secondary hover:text-neuro-text-primary transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {!explanation ? (
        <div className="p-6 rounded-lg bg-neuro-bg-secondary border border-neuro-border-subtle text-center">
          <MessageCircle className="w-8 h-8 text-neuro-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-neuro-text-secondary mb-2">
            Generate a plain-language explanation
          </p>
          <p className="text-xs text-neuro-text-tertiary">
            Suitable for sharing with patients and family members
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-neuro-bg-secondary border border-neuro-border-subtle">
          <div className="prose prose-invert prose-sm max-w-none">
            {explanation.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-sm text-neuro-text-secondary leading-relaxed mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neuro-border-subtle flex items-center justify-between">
            <span className="text-xs text-neuro-text-tertiary">
              {/* AI attribution removed */}
            </span>
            <button
              onClick={generateExplanation}
              className="text-xs text-neuro-salvaged hover:underline"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
