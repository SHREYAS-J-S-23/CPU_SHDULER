from dataclasses import dataclass
from typing import Dict, List

from .models import AlgorithmMetrics, ProcessIn, ScheduleEntry, TaskType

BASE_POWER = 15.0
STATIC_POWER_RATIO = 0.1
DVFS_MAP: Dict[TaskType, float] = {
    "search": 0.6,
    "io": 0.5,
    "sort": 0.8,
    "matrix": 1.0,
}


@dataclass
class ProcessData:
    pid: str
    name: str
    burst_time: float
    arrival_time: float
    priority: int
    task_type: TaskType
    frequency: float


def normalize_processes(processes: List[ProcessIn]) -> List[ProcessData]:
    normalized: List[ProcessData] = []
    for p in processes:
        frequency = p.frequency if p.frequency is not None else DVFS_MAP[p.task_type]
        normalized.append(
            ProcessData(
                pid=p.pid,
                name=p.name,
                burst_time=p.burst_time,
                arrival_time=p.arrival_time,
                priority=p.priority,
                task_type=p.task_type,
                frequency=frequency,
            )
        )
    return normalized


def compute_metrics(
    algorithm: str,
    schedule: List[ScheduleEntry],
    processes: List[ProcessData],
) -> AlgorithmMetrics:
    if not schedule:
        return AlgorithmMetrics(
            algorithm=algorithm,
            cpu_power_watts=0,
            execution_time_ms=0,
            cpu_utilization=0,
            dvfs_effectiveness=0,
            avg_waiting_time=0,
            avg_turnaround_time=0,
            total_energy=0,
            energy_score=0,
            schedule=[],
        )

    first_start = min(entry.start_time for entry in schedule)
    last_end = max(entry.end_time for entry in schedule)
    makespan = last_end - first_start

    process_completion: Dict[str, float] = {}
    process_first_start: Dict[str, float] = {}
    for entry in schedule:
        if entry.pid not in process_first_start:
            process_first_start[entry.pid] = entry.start_time
        process_completion[entry.pid] = max(
            process_completion.get(entry.pid, 0), entry.end_time
        )

    process_map: Dict[str, ProcessData] = {p.pid: p for p in processes}

    total_waiting = 0.0
    total_turnaround = 0.0
    count = 0
    for pid, completion_time in process_completion.items():
        p = process_map.get(pid)
        if p is None:
            continue
        turnaround = completion_time - p.arrival_time
        waiting = turnaround - p.burst_time
        total_waiting += waiting
        total_turnaround += turnaround
        count += 1

    total_energy = 0.0
    total_power = 0.0
    busy_time = 0.0
    for entry in schedule:
        duration = entry.end_time - entry.start_time
        dynamic_power = BASE_POWER * entry.frequency * entry.frequency
        static_power = STATIC_POWER_RATIO * BASE_POWER
        power = dynamic_power + static_power
        total_energy += power * (duration / 1000)
        total_power += power * duration
        busy_time += duration

    max_energy = 0.0
    for p in processes:
        max_energy += (BASE_POWER + STATIC_POWER_RATIO * BASE_POWER) * (
            p.burst_time / 1000
        )

    avg_power = total_power / makespan if makespan > 0 else 0
    utilization = (busy_time / makespan) * 100 if makespan > 0 else 0
    dvfs = ((max_energy - total_energy) / max_energy) * 100 if max_energy > 0 else 0

    if count == 0:
        count = 1

    score = (
        0.35 * max(dvfs, 0)
        + 0.30 * utilization
        + 0.20 * (1 - (total_waiting / count) / (makespan or 1)) * 100
        + 0.15 * (1 - total_energy / (max_energy or 1)) * 100
    )

    return AlgorithmMetrics(
        algorithm=algorithm,
        cpu_power_watts=round(avg_power, 2),
        execution_time_ms=makespan,
        cpu_utilization=round(utilization, 2),
        dvfs_effectiveness=round(max(dvfs, 0), 2),
        avg_waiting_time=round(total_waiting / count, 2),
        avg_turnaround_time=round(total_turnaround / count, 2),
        total_energy=round(total_energy, 3),
        energy_score=round(score, 2),
        schedule=schedule,
    )


def fcfs(processes: List[ProcessData]) -> AlgorithmMetrics:
    sorted_processes = sorted(processes, key=lambda p: p.arrival_time)
    schedule: List[ScheduleEntry] = []
    current_time = 0.0

    for p in sorted_processes:
        if current_time < p.arrival_time:
            current_time = p.arrival_time
        schedule.append(
            ScheduleEntry(
                pid=p.pid,
                process_name=p.name,
                start_time=current_time,
                end_time=current_time + p.burst_time,
                frequency=1.0,
                task_type=p.task_type,
            )
        )
        current_time += p.burst_time

    return compute_metrics("FCFS", schedule, processes)


def sjf(processes: List[ProcessData]) -> AlgorithmMetrics:
    remaining = processes[:]
    schedule: List[ScheduleEntry] = []
    current_time = 0.0

    while remaining:
        available = [p for p in remaining if p.arrival_time <= current_time]
        if not available:
            current_time = min(p.arrival_time for p in remaining)
            continue
        available.sort(key=lambda p: p.burst_time)
        p = available[0]
        schedule.append(
            ScheduleEntry(
                pid=p.pid,
                process_name=p.name,
                start_time=current_time,
                end_time=current_time + p.burst_time,
                frequency=1.0,
                task_type=p.task_type,
            )
        )
        current_time += p.burst_time
        remaining.remove(p)

    return compute_metrics("SJF", schedule, processes)


def priority_scheduling(processes: List[ProcessData]) -> AlgorithmMetrics:
    remaining = processes[:]
    schedule: List[ScheduleEntry] = []
    current_time = 0.0

    while remaining:
        available = [p for p in remaining if p.arrival_time <= current_time]
        if not available:
            current_time = min(p.arrival_time for p in remaining)
            continue
        available.sort(key=lambda p: (p.priority, p.arrival_time))
        p = available[0]
        schedule.append(
            ScheduleEntry(
                pid=p.pid,
                process_name=p.name,
                start_time=current_time,
                end_time=current_time + p.burst_time,
                frequency=1.0,
                task_type=p.task_type,
            )
        )
        current_time += p.burst_time
        remaining.remove(p)

    return compute_metrics("Priority", schedule, processes)


def round_robin(processes: List[ProcessData], quantum: int = 4) -> AlgorithmMetrics:
    quantum = max(1, int(quantum))
    sorted_processes = sorted(processes, key=lambda p: p.arrival_time)
    remaining_burst: Dict[str, float] = {p.pid: p.burst_time for p in sorted_processes}

    schedule: List[ScheduleEntry] = []
    queue: List[ProcessData] = []
    current_time = 0.0
    idx = 0

    while idx < len(sorted_processes) and sorted_processes[idx].arrival_time <= current_time:
        queue.append(sorted_processes[idx])
        idx += 1

    while queue or idx < len(sorted_processes):
        if not queue:
            current_time = sorted_processes[idx].arrival_time
            while idx < len(sorted_processes) and sorted_processes[idx].arrival_time <= current_time:
                queue.append(sorted_processes[idx])
                idx += 1

        p = queue.pop(0)
        exec_time = min(remaining_burst[p.pid], quantum)
        schedule.append(
            ScheduleEntry(
                pid=p.pid,
                process_name=p.name,
                start_time=current_time,
                end_time=current_time + exec_time,
                frequency=1.0,
                task_type=p.task_type,
            )
        )
        current_time += exec_time
        remaining_burst[p.pid] -= exec_time

        while idx < len(sorted_processes) and sorted_processes[idx].arrival_time <= current_time:
            queue.append(sorted_processes[idx])
            idx += 1

        if remaining_burst[p.pid] > 0:
            queue.append(p)

    return compute_metrics("Round Robin", schedule, processes)


def energy_efficient(processes: List[ProcessData]) -> AlgorithmMetrics:
    with_dvfs = []
    for p in processes:
        frequency = DVFS_MAP[p.task_type]
        energy_weight = p.burst_time * frequency * BASE_POWER
        with_dvfs.append((energy_weight, p, frequency))

    with_dvfs.sort(key=lambda item: (item[0], item[1].burst_time))

    schedule: List[ScheduleEntry] = []
    current_time = 0.0

    for _, p, frequency in with_dvfs:
        if current_time < p.arrival_time:
            current_time = p.arrival_time
        schedule.append(
            ScheduleEntry(
                pid=p.pid,
                process_name=p.name,
                start_time=current_time,
                end_time=current_time + p.burst_time,
                frequency=frequency,
                task_type=p.task_type,
            )
        )
        current_time += p.burst_time

    return compute_metrics("Energy-Efficient", schedule, processes)


def run_all_algorithms(
    processes: List[ProcessIn],
    quantum: int = 4,
) -> List[AlgorithmMetrics]:
    normalized = normalize_processes(processes)
    return [
        fcfs(normalized),
        sjf(normalized),
        priority_scheduling(normalized),
        round_robin(normalized, quantum),
        energy_efficient(normalized),
    ]
