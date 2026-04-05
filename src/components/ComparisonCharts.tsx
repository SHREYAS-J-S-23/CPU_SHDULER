import { AlgorithmMetrics } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ComparisonChartsProps {
  results: AlgorithmMetrics[];
}

export function ComparisonCharts({ results }: ComparisonChartsProps) {
  const energyData = results.map(r => ({
    name: r.algorithm,
    energy: Math.round(r.totalEnergy * 1000),
  }));

  const performanceData = results.map(r => ({
    name: r.algorithm,
    "Avg Wait (ms)": r.avgWaitingTime,
    "Avg TAT (ms)": r.avgTurnaroundTime,
  }));

  const utilizationData = results.map(r => ({
    name: r.algorithm,
    "CPU Util %": r.cpuUtilization,
    "DVFS Savings %": r.dvfsEffectiveness,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Total Energy (mJ)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="energy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Performance Metrics</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Avg Wait (ms)" fill="hsl(var(--energy-blue))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Avg TAT (ms)" fill="hsl(var(--energy-amber))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Utilization & DVFS</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={utilizationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="CPU Util %" fill="hsl(var(--energy-purple))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="DVFS Savings %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
