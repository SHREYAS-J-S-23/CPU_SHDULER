# Backend (FastAPI)

## Prerequisites
- Python 3.10+

## Setup
1) Create and activate a virtual environment.
2) Install dependencies:

```
pip install -r requirements.txt
```

## Run the API
From the backend folder:

```
uvicorn app.main:app --reload --port 8000
```

## Quick test checklist
- `GET /health` returns `{ "status": "ok" }`
- `POST /dataset/random` returns a `processes` array
- `POST /dataset/system` returns live processes (requires `psutil`)
- `POST /dataset/csv` accepts a CSV file upload
- `POST /schedule` returns `results` with schedules and metrics

## CSV columns
Required:
- burstTime
- arrivalTime
- priority
- taskType (search, sort, matrix, io)

Optional:
- pid
- name
- frequency
