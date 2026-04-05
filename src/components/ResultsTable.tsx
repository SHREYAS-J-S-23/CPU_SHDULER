import { AlgorithmMetrics } from "@/lib/types";

interface ResultsTableProps {
  results: AlgorithmMetrics[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  return (
    <div className="glass-card rounded-lg p-4 overflow-x-auto">
      <h3 className="text-sm font-semibold text-foreground mb-3">📊 Full Results Comparison</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Algorithm", "Power (W)", "Exec Time (ms)", "CPU Util %", "DVFS %", "Avg WT (ms)", "Avg TAT (ms)", "Energy (J)", "Score"].map(h => (
              <th key={h} className="text-left p-2 font-medium text-muted-foreground text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.algorithm} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="p-2 font-semibold text-foreground">{r.algorithm}</td>
              <td className="p-2 font-mono">{r.cpuPowerWatts}</td>
              <td className="p-2 font-mono">{r.executionTimeMs}</td>
              <td className="p-2 font-mono">{r.cpuUtilization}</td>
              <td className="p-2 font-mono">{r.dvfsEffectiveness}</td>
              <td className="p-2 font-mono">{r.avgWaitingTime}</td>
              <td className="p-2 font-mono">{r.avgTurnaroundTime}</td>
              <td className="p-2 font-mono">{r.totalEnergy}</td>
              <td className="p-2 font-mono font-bold text-primary">{r.energyScore.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
