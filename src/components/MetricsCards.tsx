import { AlgorithmMetrics } from "@/lib/types";
import { Zap, Clock, Cpu, TrendingDown } from "lucide-react";

interface MetricsCardsProps {
  metrics: AlgorithmMetrics;
}

const cards = [
  { key: "cpuPowerWatts", label: "CPU Power", unit: "W", icon: Zap, color: "text-energy-amber" },
  { key: "executionTimeMs", label: "Exec Time", unit: "ms", icon: Clock, color: "text-energy-blue" },
  { key: "cpuUtilization", label: "CPU Util", unit: "%", icon: Cpu, color: "text-energy-purple" },
  { key: "dvfsEffectiveness", label: "DVFS Savings", unit: "%", icon: TrendingDown, color: "text-primary" },
] as const;

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(({ key, label, unit, icon: Icon, color }) => (
        <div key={key} className="glass-card rounded-lg p-3 flex items-center gap-3">
          <div className={`${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-bold font-mono">
              {(metrics as any)[key]}<span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
