import { cn } from "../../lib/utils";
import { ArrowRight, Activity, GitBranch, Target } from "lucide-react";

interface CausalChange {
  action: string;
  mediator: string;
  outcome: string;
  outcomeDelta: number;
}

interface CausalChangeStripProps {
  change: CausalChange;
  className?: string;
}

export function CausalChangeStrip({ change, className }: CausalChangeStripProps) {
  return (
    <div
      className={cn(
        "glass-panel px-4 py-3 flex items-center gap-3 flex-wrap",
        className
      )}
    >
      {/* Action Pill */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="causal-pill bg-neuro-info/20 text-neuro-info">
          <Activity className="w-3 h-3" />
        </div>
        <span className="text-sm text-neuro-text-secondary whitespace-nowrap">
          You changed:
        </span>
        <span className="text-sm font-medium text-neuro-text-primary whitespace-nowrap">
          {change.action}
        </span>
      </div>

      <ArrowRight className="w-4 h-4 text-neuro-text-tertiary flex-shrink-0" />

      {/* Mediator Pill */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="causal-pill bg-neuro-penumbra/20 text-neuro-penumbra">
          <GitBranch className="w-3 h-3" />
        </div>
        <span className="text-sm text-neuro-text-secondary whitespace-nowrap">
          This affects:
        </span>
        <span className="text-sm font-medium text-neuro-text-primary whitespace-nowrap">
          {change.mediator}
        </span>
      </div>

      <ArrowRight className="w-4 h-4 text-neuro-text-tertiary flex-shrink-0" />

      {/* Outcome Pill */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className={cn(
            "causal-pill",
            change.outcomeDelta >= 0
              ? "bg-neuro-positive/20 text-neuro-positive"
              : "bg-neuro-negative/20 text-neuro-negative"
          )}
        >
          <Target className="w-3 h-3" />
        </div>
        <span className="text-sm text-neuro-text-secondary whitespace-nowrap">
          Predicted outcome:
        </span>
        <span
          className={cn(
            "text-sm font-semibold whitespace-nowrap",
            change.outcomeDelta >= 0
              ? "text-neuro-positive"
              : "text-neuro-negative"
          )}
        >
          {change.outcome}
        </span>
      </div>
    </div>
  );
}
