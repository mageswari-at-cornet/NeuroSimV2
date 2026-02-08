import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "../../lib/utils";

interface TissueFateData {
  core: number;
  salvaged: number;
  atRisk: number;
}

interface TissueFateDonutProps {
  data: TissueFateData;
  className?: string;
  isCompact?: boolean;
}

export function TissueFateDonut({ data, className, isCompact }: TissueFateDonutProps) {
  const total = data.core + data.salvaged + data.atRisk;
  
  const chartData = [
    { name: "Core (Dead)", value: data.core, color: "#ef4444" },
    { name: "Salvaged", value: data.salvaged, color: "#06b6d4" },
    { name: "At Risk", value: data.atRisk, color: "#f59e0b" },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
      return (
        <div className="bg-neuro-bg-tertiary border border-neuro-border-default rounded-lg p-2 shadow-xl">
          <p className="text-sm font-medium text-neuro-text-primary">{item.name}</p>
          <p className="text-xs text-neuro-text-secondary">
            {item.value} cc ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("chart-container", className)}>
      <h3 className={cn("text-sm font-semibold text-neuro-text-primary", isCompact ? "mb-2" : "mb-4")}>Tissue Fate</h3>
      <div className={cn("relative", isCompact ? "h-36" : "h-48")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={isCompact ? 35 : 50}
              outerRadius={isCompact ? 55 : 80}
              paddingAngle={2}
              dataKey="value"
              animationDuration={500}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={cn("font-bold tabular-nums text-neuro-text-primary", isCompact ? "text-lg" : "text-2xl")}>
            {total}
          </span>
          <span className="text-xs text-neuro-text-secondary">cc total</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className={cn(isCompact ? "mt-2 flex flex-col items-center gap-1" : "mt-4 flex justify-center gap-6")}>
        {chartData.map((item) => (
          <div key={item.name} className={cn("flex items-center gap-2", isCompact && "w-full justify-center")}>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex flex-col items-start">
              <span className="text-xs text-neuro-text-secondary leading-none">{item.name}</span>
              <span className="text-xs font-medium tabular-nums text-neuro-text-primary leading-none mt-0.5">
                {item.value}cc
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
