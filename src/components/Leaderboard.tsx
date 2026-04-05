import { AlgorithmMetrics } from "@/lib/types";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardProps {
  results: AlgorithmMetrics[];
}

const rankIcons = [
  <Trophy className="w-5 h-5 text-accent" />,
  <Medal className="w-5 h-5 text-muted-foreground" />,
  <Award className="w-5 h-5 text-energy-amber" />,
];

export function Leaderboard({ results }: LeaderboardProps) {
  const sorted = [...results].sort((a, b) => b.energyScore - a.energyScore);

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">⚡ Energy Score Leaderboard</h3>
      <div className="space-y-2">
        {sorted.map((r, i) => (
          <div
            key={r.algorithm}
            className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
              i === 0 ? "gradient-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
            }`}
          >
            <span className="text-lg font-bold w-6 text-center">{i < 3 ? rankIcons[i] : `#${i + 1}`}</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">{r.algorithm}</div>
              <div className={`text-xs ${i === 0 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {r.cpuPowerWatts}W · {r.executionTimeMs}ms · {r.cpuUtilization}% util
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold font-mono">{r.energyScore.toFixed(1)}</div>
              <div className={`text-xs ${i === 0 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
