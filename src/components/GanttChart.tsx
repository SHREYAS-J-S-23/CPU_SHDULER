import { AlgorithmMetrics, TASK_COLORS } from "@/lib/types";

interface GanttChartProps {
  metrics: AlgorithmMetrics;
}

export function GanttChart({ metrics }: GanttChartProps) {
  const { schedule, algorithm } = metrics;
  if (schedule.length === 0) return null;

  const maxTime = Math.max(...schedule.map(s => s.endTime));
  const pids = [...new Set(schedule.map(s => s.pid))];

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{algorithm} — Gantt Chart</h3>
      <div className="space-y-1.5">
        {pids.map(pid => {
          const entries = schedule.filter(s => s.pid === pid);
          return (
            <div key={pid} className="flex items-center gap-2">
              <span className="text-xs font-mono w-8 text-muted-foreground shrink-0">{pid}</span>
              <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
                {entries.map((entry, i) => {
                  const left = (entry.startTime / maxTime) * 100;
                  const width = ((entry.endTime - entry.startTime) / maxTime) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full rounded-sm flex items-center justify-center text-[10px] font-medium"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 1)}%`,
                        backgroundColor: TASK_COLORS[entry.taskType],
                        color: "white",
                      }}
                      title={`${entry.processName} (${entry.startTime}-${entry.endTime}ms, f=${entry.frequency})`}
                    >
                      {width > 8 ? `${entry.startTime}-${entry.endTime}` : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* Timeline */}
      <div className="flex items-center gap-2 mt-2">
        <span className="w-8" />
        <div className="flex-1 flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0</span>
          <span>{Math.round(maxTime / 4)}</span>
          <span>{Math.round(maxTime / 2)}</span>
          <span>{Math.round((3 * maxTime) / 4)}</span>
          <span>{maxTime}</span>
        </div>
      </div>
    </div>
  );
}
