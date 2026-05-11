import { useRef, useState, useMemo } from "react";
import { Process, DEFAULT_PROCESSES, AlgorithmMetrics } from "@/lib/types";
import { runAllAlgorithms } from "@/lib/schedulers";
import {
  fetchRandomDataset,
  fetchSystemDataset,
  runSchedule,
  uploadCsvDataset,
} from "@/lib/api";
import { ProcessTable } from "@/components/ProcessTable";
import { GanttChart } from "@/components/GanttChart";
import { ComparisonCharts } from "@/components/ComparisonCharts";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { Leaderboard } from "@/components/Leaderboard";
import { MetricsCards } from "@/components/MetricsCards";
import { DVFSChart } from "@/components/DVFSChart";
import { ResultsTable } from "@/components/ResultsTable";
import { CheatSheet } from "@/components/CheatSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Play } from "lucide-react";

const Index = () => {
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [quantum, setQuantum] = useState(4);
  const [datasetCount, setDatasetCount] = useState(20);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [systemIntervalMs, setSystemIntervalMs] = useState(100);
  const [systemLoading, setSystemLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSummary, setCsvSummary] = useState<{
    count: number;
    sample: string[];
    fileName: string;
  } | null>(null);
  const [datasetSource, setDatasetSource] = useState<
    "manual" | "random" | "system" | "csv"
  >("manual");
  const [lastDatasetAt, setLastDatasetAt] = useState<Date | null>(new Date());
  const [results, setResults] = useState<AlgorithmMetrics[] | null>(null);
  const [selectedAlgo, setSelectedAlgo] = useState(0);
  const [backendStatus, setBackendStatus] = useState<
    "unknown" | "ok" | "offline"
  >("unknown");
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const handleGenerateDataset = async () => {
    const safeCount = Math.max(1, Math.floor(datasetCount || 1));
    setDatasetLoading(true);
    try {
      const response = await fetchRandomDataset({ count: safeCount });
      setBackendStatus("ok");
      setProcesses(response.processes);
      setResults(null);
      setSelectedAlgo(0);
      setCsvSummary(null);
      setDatasetSource("random");
      setLastDatasetAt(new Date());
    } catch (error) {
      setBackendStatus("offline");
    } finally {
      setDatasetLoading(false);
    }
  };

  const handleGenerateSystemDataset = async () => {
    const safeCount = Math.max(1, Math.floor(datasetCount || 1));
    const safeInterval = Math.max(10, Math.floor(systemIntervalMs || 100));
    setSystemLoading(true);
    try {
      const response = await fetchSystemDataset({
        count: safeCount,
        intervalMs: safeInterval,
      });
      setBackendStatus("ok");
      setProcesses(response.processes);
      setResults(null);
      setSelectedAlgo(0);
      setCsvSummary(null);
      setDatasetSource("system");
      setLastDatasetAt(new Date());
    } catch (error) {
      setBackendStatus("offline");
    } finally {
      setSystemLoading(false);
    }
  };

  const handleProcessChange = (nextProcesses: Process[]) => {
    setProcesses(nextProcesses);
    setResults(null);
    setSelectedAlgo(0);
    setCsvSummary(null);
    setDatasetSource("manual");
    setLastDatasetAt(new Date());
  };

  const handleCsvUpload = async (file: File | null) => {
    if (!file) return;
    setCsvLoading(true);
    setCsvError(null);
    try {
      const response = await uploadCsvDataset(file);
      setBackendStatus("ok");
      setProcesses(response.processes);
      setResults(null);
      setSelectedAlgo(0);
      setCsvSummary({
        count: response.processes.length,
        sample: response.processes.slice(0, 3).map(p => p.name),
        fileName: file.name,
      });
      setDatasetSource("csv");
      setLastDatasetAt(new Date());
    } catch (error) {
      setBackendStatus("offline");
      const message = error instanceof Error ? error.message : "Upload failed";
      setCsvError(message);
      setCsvSummary(null);
    } finally {
      setCsvLoading(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const handleRun = async () => {
    try {
      const response = await runSchedule({ processes, quantum });
      setBackendStatus("ok");
      setResults(response.results);
      setSelectedAlgo(0);
      return;
    } catch (error) {
      setBackendStatus("offline");
    }

    const r = runAllAlgorithms(processes, quantum);
    setResults(r);
    setSelectedAlgo(0);
  };

  const datasetLabel = useMemo(() => {
    switch (datasetSource) {
      case "random":
        return "Random";
      case "system":
        return "Live System";
      case "csv":
        return "CSV Upload";
      default:
        return "Manual";
    }
  }, [datasetSource]);

  const backendLabel = useMemo(() => {
    switch (backendStatus) {
      case "ok":
        return "Online";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  }, [backendStatus]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastDatasetAt) return "n/a";
    return lastDatasetAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastDatasetAt]);

  const backendToneClass =
    backendStatus === "ok"
      ? "text-primary"
      : backendStatus === "offline"
        ? "text-destructive"
        : "text-muted-foreground";

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
        <div className="glass-card rounded-lg p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            Backend: <span className={`font-semibold ${backendToneClass}`}>{backendLabel}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Dataset: <span className="font-semibold text-foreground">{datasetLabel}</span> · {processes.length} tasks
          </div>
          <div className="text-xs text-muted-foreground">
            Last update: <span className="font-semibold text-foreground">{lastUpdatedLabel}</span>
          </div>
        </div>
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <ProcessTable processes={processes} onChange={handleProcessChange} />
          </div>
          <div className="md:w-64 space-y-4">
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Settings</h3>
              <div className="text-xs text-muted-foreground">
                Backend status: {backendStatus}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Random dataset size</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={datasetCount}
                    onChange={e => setDatasetCount(Number(e.target.value))}
                    className="h-8 w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDataset}
                    disabled={datasetLoading}
                  >
                    {datasetLoading ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Live system sample (ms)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={10}
                    max={2000}
                    value={systemIntervalMs}
                    onChange={e => setSystemIntervalMs(Number(e.target.value))}
                    className="h-8 w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSystemDataset}
                    disabled={systemLoading}
                  >
                    {systemLoading ? "Sampling..." : "Live System"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">CSV dataset</label>
                <Input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  className="h-8"
                  disabled={csvLoading}
                  onChange={e => handleCsvUpload(e.target.files?.[0] ?? null)}
                />
                {csvLoading && (
                  <div className="text-xs text-muted-foreground">Uploading...</div>
                )}
                {csvSummary && !csvLoading && (
                  <div className="text-xs text-muted-foreground">
                    Loaded {csvSummary.count} tasks from {csvSummary.fileName}.
                    {csvSummary.sample.length > 0
                      ? ` Sample: ${csvSummary.sample.join(", ")}.`
                      : ""}
                  </div>
                )}
                {csvError && (
                  <div className="text-xs text-destructive">{csvError}</div>
                )}
              </div>
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

            {/* Advanced Analytics */}
            <AnalyticsCharts results={results} selectedIndex={selectedAlgo} />

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
