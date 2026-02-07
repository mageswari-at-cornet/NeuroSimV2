import { cn } from "../../lib/utils";

interface RiskGaugeProps {
  label: string;
  value: number; // 1-5 scale
  max?: number;
  className?: string;
}

export function RiskGauge({
  label,
  value,
  max = 5,
  className,
}: RiskGaugeProps) {
  const percentage = (value / max) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-neuro-text-secondary">{label}</span>
        <span className="text-xs font-medium tabular-nums text-neuro-text-primary">
          {value}/{max}
        </span>
      </div>
      {/* Background track - using inline styles for guaranteed visibility */}
      <div 
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)' }}
      >
        {/* Filled portion - using inline styles for guaranteed visibility */}
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: value <= 2 ? '#06b6d4' : value === 3 ? '#f59e0b' : '#ef4444'
          }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-[10px] text-neuro-text-tertiary">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
