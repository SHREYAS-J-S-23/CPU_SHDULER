import { AlgorithmMetrics, ScheduleEntry } from "@/lib/types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsChartsProps {
  results: AlgorithmMetrics[];
  selectedIndex: number;
}

function buildUtilizationData(schedule: ScheduleEntry[]) {
  if (schedule.length === 0) return [];
  const maxTime = Math.max(...schedule.map(entry => entry.endTime));
  if (maxTime <= 0) return [];

  const step = Math.max(1, Math.ceil(maxTime / 24));
  const data = [] as { time: number; utilization: number }[];

  for (let start = 0; start <= maxTime; start += step) {
    const end = Math.min(maxTime, start + step);
    const window = Math.max(1, end - start);
    let busy = 0;

    for (const entry of schedule) {
      const overlap = Math.max(
        0,
        Math.min(entry.endTime, end) - Math.max(entry.startTime, start)
      );
      busy += overlap;
    }

    const utilization = Math.round(((busy / window) * 100) * 100) / 100;
    data.push({ time: Math.round(start), utilization });
  }

  return data;
}

function buildThroughputData(schedule: ScheduleEntry[]) {
  if (schedule.length === 0) return [];
  const maxTime = Math.max(...schedule.map(entry => entry.endTime));
  if (maxTime <= 0) return [];

  const completionByPid: Record<string, number> = {};
  for (const entry of schedule) {
    completionByPid[entry.pid] = Math.max(
      completionByPid[entry.pid] ?? 0,
      entry.endTime
    );
  }

  const completionTimes = Object.values(completionByPid).sort((a, b) => a - b);
  const step = Math.max(1, Math.ceil(maxTime / 12));

  const data = [] as { time: number; throughput: number; completed: number }[];
  let idx = 0;

  for (let start = 0; start <= maxTime; start += step) {
    const end = Math.min(maxTime, start + step);
    const window = Math.max(1, end - start);
    let completed = 0;

    while (idx < completionTimes.length && completionTimes[idx] <= end) {
      completed += 1;
      idx += 1;
    }

    const throughput = Math.round((completed / (window / 1000)) * 100) / 100;
    data.push({ time: Math.round(end), throughput, completed });
  }

  return data;
}

export function AnalyticsCharts({ results, selectedIndex }: AnalyticsChartsProps) {
  const selected = results[selectedIndex] ?? results[0];
  if (!selected || selected.schedule.length === 0) return null;

  const utilizationData = buildUtilizationData(selected.schedule);
  const throughputData = buildThroughputData(selected.schedule);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          CPU Utilization Timeline — {selected.algorithm}
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={utilizationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => `${value}%`}
              labelFormatter={label => `t=${label}ms`}
            />
            <Area
              type="monotone"
              dataKey="utilization"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Throughput (tasks/sec) — {selected.algorithm}
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={throughputData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) =>
                name === "throughput" ? `${value} tasks/s` : value
              }
              labelFormatter={label => `t<=${label}ms`}
            />
            <Bar
              dataKey="throughput"
              name="throughput"
              fill="hsl(var(--energy-blue))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
