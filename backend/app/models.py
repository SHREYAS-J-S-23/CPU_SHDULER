from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

TaskType = Literal["search", "sort", "matrix", "io"]


class ProcessIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pid: str
    name: str
    burst_time: float = Field(alias="burstTime")
    arrival_time: float = Field(alias="arrivalTime")
    priority: int
    task_type: TaskType = Field(alias="taskType")
    frequency: Optional[float] = None


class ScheduleEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pid: str
    process_name: str = Field(alias="processName")
    start_time: float = Field(alias="startTime")
    end_time: float = Field(alias="endTime")
    frequency: float
    task_type: TaskType = Field(alias="taskType")


class AlgorithmMetrics(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    algorithm: str
    cpu_power_watts: float = Field(alias="cpuPowerWatts")
    execution_time_ms: float = Field(alias="executionTimeMs")
    cpu_utilization: float = Field(alias="cpuUtilization")
    dvfs_effectiveness: float = Field(alias="dvfsEffectiveness")
    avg_waiting_time: float = Field(alias="avgWaitingTime")
    avg_turnaround_time: float = Field(alias="avgTurnaroundTime")
    total_energy: float = Field(alias="totalEnergy")
    energy_score: float = Field(alias="energyScore")
    schedule: List[ScheduleEntry]


class ScheduleRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    processes: List[ProcessIn]
    quantum: int = 4


class ScheduleResponse(BaseModel):
    results: List[AlgorithmMetrics]


class DatasetRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    count: int = 20
    max_arrival: int = Field(default=20, alias="maxArrival")
    max_burst: int = Field(default=15, alias="maxBurst")
    max_priority: int = Field(default=5, alias="maxPriority")
    seed: Optional[int] = None
    task_types: Optional[List[TaskType]] = Field(default=None, alias="taskTypes")


class DatasetResponse(BaseModel):
    processes: List[ProcessIn]
    seed: Optional[int] = None


class SystemDatasetRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    count: int = 15
    interval_ms: int = Field(default=100, alias="intervalMs")
