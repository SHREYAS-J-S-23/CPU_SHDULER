from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .dataset import (
    generate_random_processes,
    generate_system_processes,
    parse_csv_dataset,
)
from .models import (
    DatasetRequest,
    DatasetResponse,
    ScheduleRequest,
    ScheduleResponse,
    SystemDatasetRequest,
)
from .scheduler import run_all_algorithms

app = FastAPI(title="CPU Scheduler API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/schedule", response_model=ScheduleResponse)
def schedule(request: ScheduleRequest) -> ScheduleResponse:
    results = run_all_algorithms(request.processes, request.quantum)
    return ScheduleResponse(results=results)


@app.post("/dataset/random", response_model=DatasetResponse)
def random_dataset(request: DatasetRequest) -> DatasetResponse:
    processes = generate_random_processes(
        count=request.count,
        max_arrival=request.max_arrival,
        max_burst=request.max_burst,
        max_priority=request.max_priority,
        seed=request.seed,
        task_types=request.task_types,
    )
    return DatasetResponse(processes=processes, seed=request.seed)


@app.post("/dataset/system", response_model=DatasetResponse)
def system_dataset(request: SystemDatasetRequest) -> DatasetResponse:
    try:
        processes = generate_system_processes(
            count=request.count,
            interval_ms=request.interval_ms,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return DatasetResponse(processes=processes, seed=None)


@app.post("/dataset/csv", response_model=DatasetResponse)
async def csv_dataset(file: UploadFile = File(...)) -> DatasetResponse:
    try:
        payload = await file.read()
        processes = parse_csv_dataset(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return DatasetResponse(processes=processes, seed=None)
