import { useState, useMemo } from "react";
import { Process, DEFAULT_PROCESSES, AlgorithmMetrics } from "@/lib/types";
import { runAllAlgorithms } from "@/lib/schedulers";
import { ProcessTable } from "@/components/ProcessTable";
import { GanttChart } from "@/components/GanttChart";
import { ComparisonCharts } from "@/components/ComparisonCharts";
import { Leaderboard } from "@/components/Leaderboard";
import { MetricsCards } from "@/components/MetricsCards";
import { DVFSChart } from "@/components/DVFSChart";
import { ResultsTable } from "@/components/ResultsTable";
import { CheatSheet } from "@/components/CheatSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Play, BookOpen } from "lucide-react";

const Index = () => {
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [quantum, setQuantum] = useState(4);
  const [results, setResults] = useState<AlgorithmMetrics[] | null>(null);
  const [selectedAlgo, setSelectedAlgo] = useState(0);

  const handleRun = () => {
    const r = runAllAlgorithms(processes, quantum);
    setResults(r);
    setSelectedAlgo(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground">
        <div className="container max-w-7xl py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary-foreground/20 animate-pulse-glow">
              <Zap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Energy-Efficient CPU Scheduler
            </h1>
          </div>
          <p className="text-primary-foreground/80 text-sm max-w-2xl">
            Design & Implementation of an Energy-Efficient CPU Scheduling Algorithm — Compare FCFS, SJF, Priority, Round Robin & Custom Energy-Aware scheduling with DVFS simulation.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-primary-foreground/60">
            <span className="px-2 py-0.5 rounded-full bg-primary-foreground/10">SDG-7</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-foreground/10">DVFS</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-foreground/10">Mini Project</span>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <ProcessTable processes={processes} onChange={setProcesses} />
          </div>
          <div className="md:w-64 space-y-4">
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Settings</h3>
              <div>
                <label className="text-xs text-muted-foreground">RR Time Quantum (ms)</label>
                <Input type="number" min={1} max={20} value={quantum} onChange={e => setQuantum(Number(e.target.value))} className="mt-1" />
              </div>
              <Button className="w-full" size="lg" onClick={handleRun}>
                <Play className="w-4 h-4 mr-2" /> Run All Algorithms
              </Button>
            </div>
            <CheatSheet />
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6 animate-fade-up">
            {/* Leaderboard + selected metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Leaderboard results={results} />
              <div className="lg:col-span-2 space-y-4">
                <MetricsCards metrics={results[selectedAlgo]} />
                <Tabs defaultValue="0" onValueChange={v => setSelectedAlgo(Number(v))}>
                  <TabsList className="w-full flex">
                    {results.map((r, i) => (
                      <TabsTrigger key={i} value={String(i)} className="flex-1 text-xs">
                        {r.algorithm}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {results.map((r, i) => (
                    <TabsContent key={i} value={String(i)}>
                      <GanttChart metrics={r} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>

            {/* Comparison Charts */}
            <ComparisonCharts results={results} />

            {/* DVFS Chart */}
            <DVFSChart results={results} />

            {/* Full Results Table */}
            <ResultsTable results={results} />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="container max-w-7xl text-center text-xs text-muted-foreground">
          Energy-Efficient CPU Scheduling Simulator — Mini Project (PROJ22IS49) · Group B16 · DSCE ISE
        </div>
      </footer>
    </div>
  );
};

export default Index;
