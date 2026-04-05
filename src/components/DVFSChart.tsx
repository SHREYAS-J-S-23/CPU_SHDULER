import { AlgorithmMetrics, BASE_POWER } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DVFSChartProps {
  results: AlgorithmMetrics[];
}

export function DVFSChart({ results }: DVFSChartProps) {
  // Calculate max energy per algorithm (at freq 1.0)
  const maxEnergyPerAlgo = results.length > 0
    ? (BASE_POWER + 0.1 * BASE_POWER) * results[0].schedule.reduce((sum, s) => {
        const proc = results[0].schedule.find(e => e.pid === s.pid);
        return sum;
      }, 0)
    : 0;

  const data = results.map(r => {
    // Compute energy at 100% freq
    let fullFreqEnergy = 0;
    const pidBursts: Record<string, number> = {};
    for (const entry of r.schedule) {
      const duration = entry.endTime - entry.startTime;
      if (!pidBursts[entry.pid]) pidBursts[entry.pid] = 0;
      pidBursts[entry.pid] += duration;
    }
    for (const pid of Object.keys(pidBursts)) {
      fullFreqEnergy += (BASE_POWER + 0.1 * BASE_POWER) * (pidBursts[pid] / 1000);
    }

    return {
      name: r.algorithm,
      "Energy @ 100% Freq": Math.round(fullFreqEnergy * 1000),
      "Actual Energy": Math.round(r.totalEnergy * 1000),
    };
  });

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground">DVFS Effectiveness — Energy Comparison (mJ)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Energy @ 100% Freq" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Actual Energy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
