import {
  Process, ScheduleEntry, AlgorithmMetrics, DVFS_MAP,
  BASE_POWER, STATIC_POWER_RATIO,
} from "./types";

function computeMetrics(
  algorithm: string,
  schedule: ScheduleEntry[],
  processes: Process[]
): AlgorithmMetrics {
  if (schedule.length === 0) {
    return { algorithm, cpuPowerWatts: 0, executionTimeMs: 0, cpuUtilization: 0, dvfsEffectiveness: 0, avgWaitingTime: 0, avgTurnaroundTime: 0, totalEnergy: 0, energyScore: 0, schedule };
  }

  const firstStart = Math.min(...schedule.map(s => s.startTime));
  const lastEnd = Math.max(...schedule.map(s => s.endTime));
  const makespan = lastEnd - firstStart;

  // Per-process completion tracking
  const processCompletion: Record<string, number> = {};
  const processFirstStart: Record<string, number> = {};
  for (const entry of schedule) {
    if (!(entry.pid in processFirstStart)) processFirstStart[entry.pid] = entry.startTime;
    processCompletion[entry.pid] = Math.max(processCompletion[entry.pid] || 0, entry.endTime);
  }

  const processMap = Object.fromEntries(processes.map(p => [p.pid, p]));

  let totalWaiting = 0;
  let totalTurnaround = 0;
  let count = 0;
  for (const pid of Object.keys(processCompletion)) {
    const p = processMap[pid];
    if (!p) continue;
    const turnaround = processCompletion[pid] - p.arrivalTime;
    const waiting = turnaround - p.burstTime;
    totalWaiting += waiting;
    totalTurnaround += turnaround;
    count++;
  }

  // Energy calculations
  let totalEnergy = 0;
  let totalPower = 0;
  let busyTime = 0;
  for (const entry of schedule) {
    const duration = entry.endTime - entry.startTime;
    const dynamicPower = BASE_POWER * entry.frequency * entry.frequency;
    const staticPower = STATIC_POWER_RATIO * BASE_POWER;
    const power = dynamicPower + staticPower;
    totalEnergy += power * (duration / 1000);
    totalPower += power * duration;
    busyTime += duration;
  }

  // Max possible energy (all at freq 1.0)
  let maxEnergy = 0;
  for (const p of processes) {
    maxEnergy += (BASE_POWER + STATIC_POWER_RATIO * BASE_POWER) * (p.burstTime / 1000);
  }

  const avgPower = makespan > 0 ? totalPower / makespan : 0;
  const utilization = makespan > 0 ? (busyTime / makespan) * 100 : 0;
  const dvfs = maxEnergy > 0 ? ((maxEnergy - totalEnergy) / maxEnergy) * 100 : 0;

  // Score formula from roadmap
  const maxWaiting = Math.max(totalWaiting / count, 1);
  const maxEnergyVal = Math.max(totalEnergy, 0.001);
  const score =
    0.35 * Math.max(dvfs, 0) +
    0.30 * (utilization / 100) * 100 +
    0.20 * (1 - (totalWaiting / count) / (makespan || 1)) * 100 +
    0.15 * (1 - totalEnergy / (maxEnergy || 1)) * 100;

  return {
    algorithm,
    cpuPowerWatts: Math.round(avgPower * 100) / 100,
    executionTimeMs: makespan,
    cpuUtilization: Math.round(utilization * 100) / 100,
    dvfsEffectiveness: Math.round(Math.max(dvfs, 0) * 100) / 100,
    avgWaitingTime: Math.round((totalWaiting / count) * 100) / 100,
    avgTurnaroundTime: Math.round((totalTurnaround / count) * 100) / 100,
    totalEnergy: Math.round(totalEnergy * 1000) / 1000,
    energyScore: Math.round(score * 100) / 100,
    schedule,
  };
}

export function fcfs(processes: Process[]): AlgorithmMetrics {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const schedule: ScheduleEntry[] = [];
  let currentTime = 0;

  for (const p of sorted) {
    if (currentTime < p.arrivalTime) currentTime = p.arrivalTime;
    schedule.push({ pid: p.pid, processName: p.name, startTime: currentTime, endTime: currentTime + p.burstTime, frequency: 1.0, taskType: p.taskType });
    currentTime += p.burstTime;
  }

  return computeMetrics("FCFS", schedule, processes);
}

export function sjf(processes: Process[]): AlgorithmMetrics {
  const remaining = [...processes];
  const schedule: ScheduleEntry[] = [];
  let currentTime = 0;

  while (remaining.length > 0) {
    const available = remaining.filter(p => p.arrivalTime <= currentTime);
    if (available.length === 0) {
      currentTime = Math.min(...remaining.map(p => p.arrivalTime));
      continue;
    }
    available.sort((a, b) => a.burstTime - b.burstTime);
    const p = available[0];
    schedule.push({ pid: p.pid, processName: p.name, startTime: currentTime, endTime: currentTime + p.burstTime, frequency: 1.0, taskType: p.taskType });
    currentTime += p.burstTime;
    remaining.splice(remaining.indexOf(p), 1);
  }

  return computeMetrics("SJF", schedule, processes);
}

export function priorityScheduling(processes: Process[]): AlgorithmMetrics {
  const remaining = [...processes];
  const schedule: ScheduleEntry[] = [];
  let currentTime = 0;

  while (remaining.length > 0) {
    const available = remaining.filter(p => p.arrivalTime <= currentTime);
    if (available.length === 0) {
      currentTime = Math.min(...remaining.map(p => p.arrivalTime));
      continue;
    }
    available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
    const p = available[0];
    schedule.push({ pid: p.pid, processName: p.name, startTime: currentTime, endTime: currentTime + p.burstTime, frequency: 1.0, taskType: p.taskType });
    currentTime += p.burstTime;
    remaining.splice(remaining.indexOf(p), 1);
  }

  return computeMetrics("Priority", schedule, processes);
}

export function roundRobin(processes: Process[], quantum: number = 4): AlgorithmMetrics {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const remainingBurst: Record<string, number> = {};
  sorted.forEach(p => (remainingBurst[p.pid] = p.burstTime));

  const schedule: ScheduleEntry[] = [];
  const queue: Process[] = [];
  let currentTime = 0;
  let idx = 0;

  // Add initially arrived
  while (idx < sorted.length && sorted[idx].arrivalTime <= currentTime) {
    queue.push(sorted[idx]);
    idx++;
  }

  while (queue.length > 0 || idx < sorted.length) {
    if (queue.length === 0) {
      currentTime = sorted[idx].arrivalTime;
      while (idx < sorted.length && sorted[idx].arrivalTime <= currentTime) {
        queue.push(sorted[idx]);
        idx++;
      }
    }

    const p = queue.shift()!;
    const exec = Math.min(remainingBurst[p.pid], quantum);
    schedule.push({ pid: p.pid, processName: p.name, startTime: currentTime, endTime: currentTime + exec, frequency: 1.0, taskType: p.taskType });
    currentTime += exec;
    remainingBurst[p.pid] -= exec;

    // Add newly arrived processes
    while (idx < sorted.length && sorted[idx].arrivalTime <= currentTime) {
      queue.push(sorted[idx]);
      idx++;
    }

    if (remainingBurst[p.pid] > 0) queue.push(p);
  }

  return computeMetrics("Round Robin", schedule, processes);
}

export function energyEfficient(processes: Process[]): AlgorithmMetrics {
  const withDVFS = processes.map(p => ({
    ...p,
    frequency: DVFS_MAP[p.taskType],
    energyWeight: p.burstTime * DVFS_MAP[p.taskType] * BASE_POWER,
  }));

  // Sort by energy weight, then burst time
  withDVFS.sort((a, b) => a.energyWeight - b.energyWeight || a.burstTime - b.burstTime);

  const schedule: ScheduleEntry[] = [];
  let currentTime = 0;

  for (const p of withDVFS) {
    if (currentTime < p.arrivalTime) currentTime = p.arrivalTime;
    schedule.push({ pid: p.pid, processName: p.name, startTime: currentTime, endTime: currentTime + p.burstTime, frequency: p.frequency, taskType: p.taskType });
    currentTime += p.burstTime;
  }

  return computeMetrics("Energy-Efficient", schedule, processes);
}

export function runAllAlgorithms(processes: Process[], quantum: number = 4): AlgorithmMetrics[] {
  return [
    fcfs(processes),
    sjf(processes),
    priorityScheduling(processes),
    roundRobin(processes, quantum),
    energyEfficient(processes),
  ];
}
