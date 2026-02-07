import * as Slider from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";
import { AlertTriangle } from "lucide-react";

interface InterventionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  warning?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function InterventionSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  warning,
  onChange,
  className,
}: InterventionSliderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-neuro-text-primary">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-neuro-salvaged">
          {value}
          {unit && <span className="text-xs ml-0.5">{unit}</span>}
        </span>
      </div>
      
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        max={max}
        min={min}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      >
        <Slider.Track className="bg-neuro-bg-tertiary relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-neuro-salvaged rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 bg-neuro-salvaged rounded-full border-2 border-white shadow-lg 
                     focus:outline-none focus:ring-2 focus:ring-neuro-salvaged focus:ring-offset-2 
                     focus:ring-offset-neuro-bg-primary transition-transform hover:scale-110 active:scale-95"
        />
      </Slider.Root>
      
      <div className="flex justify-between text-xs text-neuro-text-tertiary">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      
      {warning && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-neuro-penumbra/10 border border-neuro-penumbra/20">
          <AlertTriangle className="w-4 h-4 text-neuro-penumbra flex-shrink-0 mt-0.5" />
          <span className="text-xs text-neuro-penumbra">{warning}</span>
        </div>
      )}
    </div>
  );
}
