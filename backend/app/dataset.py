import random
import time
from io import BytesIO
from typing import Dict, List, Optional

from .models import ProcessIn, TaskType
from .scheduler import DVFS_MAP

TASK_NAME_MAP: Dict[TaskType, List[str]] = {
    "search": ["File Search", "Database Search", "Index Lookup"],
    "sort": ["Quick Sort", "Merge Sort", "Heap Sort"],
    "matrix": ["Matrix Multiply", "Linear Algebra"],
    "io": ["File Compression", "Disk Sync", "Log Flush"],
}

COLUMN_ALIASES: Dict[str, str] = {
    "pid": "pid",
    "processid": "pid",
    "id": "pid",
    "name": "name",
    "task": "name",
    "burst": "burstTime",
    "bursttime": "burstTime",
    "arrival": "arrivalTime",
    "arrivaltime": "arrivalTime",
    "priority": "priority",
    "tasktype": "taskType",
    "type": "taskType",
    "frequency": "frequency",
    "freq": "frequency",
}


def generate_random_processes(
    count: int = 20,
    max_arrival: int = 20,
    max_burst: int = 15,
    max_priority: int = 5,
    seed: Optional[int] = None,
    task_types: Optional[List[TaskType]] = None,
) -> List[ProcessIn]:
    safe_count = max(1, int(count))
    safe_max_arrival = max(0, int(max_arrival))
    safe_max_burst = max(1, int(max_burst))
    safe_max_priority = max(1, int(max_priority))

    rng = random.Random(seed)
    available_types = task_types or list(TASK_NAME_MAP.keys())

    processes: List[ProcessIn] = []
    for i in range(safe_count):
        task_type = rng.choice(available_types)
        name = rng.choice(TASK_NAME_MAP[task_type])
        processes.append(
            ProcessIn(
                pid=f"T{i + 1}",
                name=name,
                burst_time=rng.randint(1, safe_max_burst),
                arrival_time=rng.randint(0, safe_max_arrival),
                priority=rng.randint(1, safe_max_priority),
                task_type=task_type,
                frequency=DVFS_MAP[task_type],
            )
        )

    return processes


def generate_system_processes(
    count: int = 15,
    interval_ms: int = 100,
) -> List[ProcessIn]:
    try:
        import psutil
    except ImportError as exc:
        raise RuntimeError("psutil is not installed") from exc

    safe_count = max(1, int(count))
    safe_interval = max(10, int(interval_ms)) / 1000

    processes = list(psutil.process_iter(attrs=["pid", "name"]))
    for proc in processes:
        try:
            proc.cpu_percent(None)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    psutil.cpu_percent(interval=None)
    time.sleep(safe_interval)

    sampled = []
    for proc in processes:
        try:
            cpu = proc.cpu_percent(None)
            mem = proc.memory_percent()
            info = proc.info
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

        sampled.append(
            {
                "pid": info.get("pid"),
                "name": info.get("name") or "System Task",
                "cpu": cpu or 0.0,
                "mem": mem or 0.0,
            }
        )

    sampled.sort(key=lambda item: item["cpu"], reverse=True)
    selected = sampled[:safe_count]

    types = list(TASK_NAME_MAP.keys())
    output: List[ProcessIn] = []
    for idx, proc in enumerate(selected):
        task_type = types[idx % len(types)]
        name = TASK_NAME_MAP[task_type][idx % len(TASK_NAME_MAP[task_type])]
        cpu_value = max(0.0, min(proc["cpu"], 100.0))
        mem_value = max(0.0, min(proc["mem"], 100.0))
        weight = max(cpu_value, mem_value)
        burst = max(1, min(15, int(round(1 + (weight / 100) * 14))))
        priority = max(1, min(5, 5 - int(round(cpu_value / 25))))
        output.append(
            ProcessIn(
                pid=f"S{idx + 1}",
                name=f"{name} ({proc['name']})",
                burst_time=burst,
                arrival_time=idx,
                priority=priority,
                task_type=task_type,
                frequency=DVFS_MAP[task_type],
            )
        )

    return output


def parse_csv_dataset(data: bytes) -> List[ProcessIn]:
    if not data:
        raise ValueError("CSV file is empty")

    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError("pandas is not installed") from exc

    df = pd.read_csv(BytesIO(data))
    if df.empty:
        raise ValueError("CSV file has no rows")

    rename_map: Dict[str, str] = {}
    for col in df.columns:
        normalized = "".join(ch for ch in str(col).lower() if ch.isalnum())
        target = COLUMN_ALIASES.get(normalized)
        if target:
            rename_map[col] = target

    if rename_map:
        df = df.rename(columns=rename_map)

    required = ["burstTime", "arrivalTime", "priority", "taskType"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    def to_float(value: object, default: float) -> float:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return default
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    processes: List[ProcessIn] = []
    for idx, row in df.iterrows():
        raw_type = str(row.get("taskType", "")).strip().lower()
        if raw_type not in TASK_NAME_MAP:
            raise ValueError(f"Invalid taskType at row {idx + 2}: {raw_type}")

        name_value = row.get("name")
        name = (
            str(name_value).strip()
            if name_value is not None and not pd.isna(name_value)
            else ""
        )
        if not name:
            name = TASK_NAME_MAP[raw_type][idx % len(TASK_NAME_MAP[raw_type])]

        pid_value = row.get("pid")
        pid = (
            str(pid_value).strip()
            if pid_value is not None and not pd.isna(pid_value)
            else ""
        )
        if not pid:
            pid = f"C{idx + 1}"

        burst = max(1.0, to_float(row.get("burstTime"), 1.0))
        arrival = max(0.0, to_float(row.get("arrivalTime"), 0.0))
        priority = int(round(to_float(row.get("priority"), 3)))
        priority = max(1, min(5, priority))

        freq_value = row.get("frequency")
        if freq_value is None or (isinstance(freq_value, float) and pd.isna(freq_value)):
            frequency = DVFS_MAP[raw_type]
        else:
            frequency = max(0.1, min(1.0, to_float(freq_value, DVFS_MAP[raw_type])))

        processes.append(
            ProcessIn(
                pid=pid,
                name=name,
                burst_time=burst,
                arrival_time=arrival,
                priority=priority,
                task_type=raw_type,
                frequency=frequency,
            )
        )

    return processes
