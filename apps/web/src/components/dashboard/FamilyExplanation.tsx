import { useState } from "react";
import { useDashboardStore } from "../../store/dashboardStore";
import { cn } from "../../lib/utils";
import { Users, Copy, Check, RefreshCw, MessageCircle } from "lucide-react";

interface FamilyExplanationProps {
  className?: string;
}

export function FamilyExplanation({ className }: FamilyExplanationProps) {
  const { activeScenario } = useDashboardStore();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const generateExplanation = () => {
    setIsGenerating(true);

    // Simulate short delay for "thinking" effect
    setTimeout(() => {
      const scenarioExplanations: Record<string, string> = {
        routing: "We have two options: start a clot-busting drug here and transfer, or go directly to the specialist center. Given the distance and traffic, going directly to the mothership minimizes the delay to the procedure (EVT), which gives the best chance of saving brain tissue.",
        bridging: "The standard care is to give a clot-busting drug (IVT) before the procedure. However, for this large clot, the drug alone rarely works and adds a small risk of bleeding. Proceeding directly to the mechanical removal (EVT) avoids that risk and saves time properly.",
        imaging: "We can do a complete scan here to be 100% sure, or skip straight to the angio suite. Since the basic scan confirms a stroke, skipping the detailed map saves about 30 minutes. Time is brain, so we recommend going straight to the procedure.",
        tandem: "There is a blockage in both the neck and the brain. We need to decide whether to open the neck first or the brain first. Acute stenting of the neck gives the best long-term result but requires strong blood thinners. We will weigh the bleeding risk carefully.",
        "large-core": "Even though a significant area of the brain has been affected, recent studies show that removing the clot can still help regain independence. We believe the benefit of the procedure removing the clot outweighs the risks, even with this larger injury.",
        "wake-up": "Since we don't know exactly when the stroke started, we used a special MRI scan. The scan shows there is still salvageable brain tissue. This 'mismatch' means we are still in time to treat safely with clot removal or medication.",
      };

      setExplanation(scenarioExplanations[activeScenario] || "Standard protocol is recommended based on the patient's specific condition and current guidelines.");
      setIsGenerating(false);
    }, 800);
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
