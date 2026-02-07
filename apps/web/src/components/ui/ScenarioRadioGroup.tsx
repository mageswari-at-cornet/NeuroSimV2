import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "../../lib/utils";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface ScenarioRadioGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ScenarioRadioGroup({
  options,
  value,
  onChange,
  className,
}: ScenarioRadioGroupProps) {
  return (
    <RadioGroup.Root
      className={cn("space-y-2", className)}
      value={value}
      onValueChange={onChange}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
            "hover:border-neuro-border-default",
            value === option.value
              ? "border-l-4 border-l-neuro-salvaged bg-neuro-bg-tertiary/80 border-neuro-border-default"
              : "border-neuro-border-subtle bg-neuro-bg-tertiary/30"
          )}
        >
          <RadioGroup.Item
            value={option.value}
            className={cn(
              "w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0",
              "focus:outline-none focus:ring-2 focus:ring-neuro-salvaged focus:ring-offset-2 focus:ring-offset-neuro-bg-primary",
              value === option.value
                ? "border-neuro-salvaged bg-neuro-salvaged"
                : "border-neuro-text-tertiary"
            )}
          >
            <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-1.5 after:h-1.5 after:rounded-full after:bg-white" />
          </RadioGroup.Item>
          <div className="flex-1">
            <span className="text-sm font-medium text-neuro-text-primary block">
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs text-neuro-text-secondary block mt-0.5">
                {option.description}
              </span>
            )}
          </div>
        </label>
      ))}
    </RadioGroup.Root>
  );
}
