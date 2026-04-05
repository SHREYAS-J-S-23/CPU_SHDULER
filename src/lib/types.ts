export type TaskType = "search" | "sort" | "matrix" | "io";

export interface Process {
  pid: string;
  name: string;
  burstTime: number;
  arrivalTime: number;
  priority: number;
  taskType: TaskType;
  frequency: number;
}

export interface ScheduleEntry {
  pid: string;
  processName: string;
  startTime: number;
  endTime: number;
  frequency: number;
  taskType: TaskType;
}

export interface AlgorithmMetrics {
  algorithm: string;
  cpuPowerWatts: number;
  executionTimeMs: number;
  cpuUtilization: number;
  dvfsEffectiveness: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  totalEnergy: number;
  energyScore: number;
  schedule: ScheduleEntry[];
}

export const DVFS_MAP: Record<TaskType, number> = {
  search: 0.6,
  io: 0.5,
  sort: 0.8,
  matrix: 1.0,
};

export const TASK_COLORS: Record<TaskType, string> = {
  search: "hsl(200, 80%, 50%)",
  sort: "hsl(38, 92%, 50%)",
  matrix: "hsl(0, 72%, 51%)",
  io: "hsl(152, 60%, 36%)",
};

export const BASE_POWER = 15.0;
export const IDLE_POWER = 2.0;
export const STATIC_POWER_RATIO = 0.1;

export const DEFAULT_PROCESSES: Process[] = [
  { pid: "P1", name: "Binary Search", burstTime: 2, arrivalTime: 0, priority: 2, taskType: "search", frequency: 0.6 },
  { pid: "P2", name: "Linear Search", burstTime: 3, arrivalTime: 1, priority: 3, taskType: "search", frequency: 0.6 },
  { pid: "P3", name: "Quick Sort", burstTime: 6, arrivalTime: 2, priority: 2, taskType: "sort", frequency: 0.8 },
  { pid: "P4", name: "Merge Sort", burstTime: 7, arrivalTime: 2, priority: 2, taskType: "sort", frequency: 0.8 },
  { pid: "P5", name: "Matrix Multiply", burstTime: 12, arrivalTime: 3, priority: 1, taskType: "matrix", frequency: 1.0 },
  { pid: "P6", name: "File Read/Write", burstTime: 5, arrivalTime: 4, priority: 4, taskType: "io", frequency: 0.5 },
  { pid: "P7", name: "Bubble Sort", burstTime: 9, arrivalTime: 5, priority: 3, taskType: "sort", frequency: 0.8 },
  { pid: "P8", name: "Binary Search 2", burstTime: 2, arrivalTime: 6, priority: 2, taskType: "search", frequency: 0.6 },
];
