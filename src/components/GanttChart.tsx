import { useState, useEffect, useRef, useCallback } from "react";
import { AlgorithmMetrics, TASK_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface GanttChartProps {
  metrics: AlgorithmMetrics;
}

export function GanttChart({ metrics }: GanttChartProps) {
  const { schedule, algorithm } = metrics;

  const maxTime = schedule.length > 0 ? Math.max(...schedule.map(s => s.endTime)) : 0;
  const pids = [...new Set(schedule.map(s => s.pid))];

  const [cursorTime, setCursorTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const cursorRef = useRef(0);

  const SPEED = 40; // ms of simulation per real ms

  const animate = useCallback((timestamp: number) => {
    if (!startRef.current) startRef.current = timestamp;
    const elapsed = timestamp - startRef.current;
    const newTime = cursorRef.current + (elapsed * SPEED) / 1000;

    if (newTime >= maxTime) {
      setCursorTime(maxTime);
      setIsPlaying(false);
      return;
    }

    setCursorTime(newTime);
    animRef.current = requestAnimationFrame(animate);
  }, [maxTime]);

  useEffect(() => {
    if (isPlaying) {
      startRef.current = 0;
      cursorRef.current = cursorTime;
      animRef.current = requestAnimationFrame(animate);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, animate]);

  // Reset on metrics change
  useEffect(() => {
    setCursorTime(0);
    setIsPlaying(false);
  }, [metrics]);

  const handlePlayPause = () => {
    if (cursorTime >= maxTime) {
      setCursorTime(0);
      cursorRef.current = 0;
    }
    setIsPlaying(p => !p);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCursorTime(0);
    cursorRef.current = 0;
  };

  if (schedule.length === 0) return null;

  const cursorPercent = (cursorTime / maxTime) * 100;

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{algorithm} — Gantt Chart</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground mr-1">
            t={Math.round(cursorTime)}ms
          </span>
          <Button variant="outline" size="icon" className="h-6 w-6" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5 relative">
        {pids.map(pid => {
          const entries = schedule.filter(s => s.pid === pid);
          return (
            <div key={pid} className="flex items-center gap-2">
              <span className="text-xs font-mono w-8 text-muted-foreground shrink-0">{pid}</span>
              <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
                {entries.map((entry, i) => {
                  const left = (entry.startTime / maxTime) * 100;
                  const fullWidth = ((entry.endTime - entry.startTime) / maxTime) * 100;

                  // Clip width to cursor position
                  let visibleWidth = 0;
                  if (cursorTime > entry.startTime) {
                    const visibleEnd = Math.min(cursorTime, entry.endTime);
                    visibleWidth = ((visibleEnd - entry.startTime) / maxTime) * 100;
                  }

                  const isActive = cursorTime >= entry.startTime && cursorTime < entry.endTime;

                  if (visibleWidth <= 0) return null;

                  return (
                    <div
                      key={i}
                      className={`absolute top-0 h-full rounded-sm flex items-center justify-center text-[10px] font-medium transition-all duration-75 ${isActive ? "ring-2 ring-primary ring-offset-1 z-10" : ""}`}
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(visibleWidth, 0.5)}%`,
                        backgroundColor: TASK_COLORS[entry.taskType],
                        color: "white",
                        opacity: isActive ? 1 : 0.8,
                      }}
                      title={`${entry.processName} (${entry.startTime}-${entry.endTime}ms, f=${entry.frequency})`}
                    >
                      {visibleWidth > 8 ? `${entry.startTime}-${entry.endTime}` : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Moving cursor line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none transition-all duration-75"
          style={{ left: `calc(2rem + 0.5rem + ${cursorPercent}% * 0.92)` }}
        />
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

      {/* Scrubber */}
      <div className="flex items-center gap-2 mt-1">
        <span className="w-8" />
        <input
          type="range"
          min={0}
          max={maxTime}
          step={0.1}
          value={cursorTime}
          onChange={e => {
            setIsPlaying(false);
            setCursorTime(Number(e.target.value));
            cursorRef.current = Number(e.target.value);
          }}
          className="flex-1 h-1 accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
}
