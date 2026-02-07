import { cn } from "../../lib/utils";
import { Brain, Clock, User, Activity } from "lucide-react";

interface PatientBadgeProps {
  label: string;
  value: string | number;
  icon?: "user" | "brain" | "clock" | "activity";
  status?: "neutral" | "warning" | "critical";
  className?: string;
}

const iconMap = {
  user: User,
  brain: Brain,
  clock: Clock,
  activity: Activity,
};

const statusStyles = {
  neutral: "border-neuro-border-subtle text-neuro-text-primary",
  warning: "border-neuro-penumbra/50 text-neuro-penumbra",
  critical: "border-neuro-core/50 text-neuro-core",
};

export function PatientBadge({
  label,
  value,
  icon,
  status = "neutral",
  className,
}: PatientBadgeProps) {
  const Icon = icon ? iconMap[icon] : null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm",
        "bg-neuro-bg-tertiary/80 border",
        statusStyles[status],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 opacity-70" />}
      <span className="text-neuro-text-secondary text-xs">{label}:</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
