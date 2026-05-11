import type { AlgorithmMetrics, Process, TaskType } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export type BackendHealth = {
  ok: boolean;
  detail: string;
};

export type ScheduleRequest = {
  processes: Process[];
  quantum: number;
};

export type ScheduleResponse = {
  results: AlgorithmMetrics[];
};

export type DatasetRequest = {
  count?: number;
  maxArrival?: number;
  maxBurst?: number;
  maxPriority?: number;
  seed?: number;
  taskTypes?: TaskType[];
};

export type DatasetResponse = {
  processes: Process[];
  seed?: number | null;
};

export type SystemDatasetRequest = {
  count?: number;
  intervalMs?: number;
};

export async function checkBackendHealth(): Promise<BackendHealth> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }

    const data = await response.json().catch(() => null);
    if (data && typeof data.status === "string") {
      return { ok: data.status.toLowerCase() === "ok", detail: data.status };
    }

    return { ok: true, detail: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, detail: message };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function runSchedule(
  request: ScheduleRequest
): Promise<ScheduleResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as ScheduleResponse;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchRandomDataset(
  request: DatasetRequest = {}
): Promise<DatasetResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/dataset/random`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as DatasetResponse;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchSystemDataset(
  request: SystemDatasetRequest = {}
): Promise<DatasetResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/dataset/system`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as DatasetResponse;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function uploadCsvDataset(file: File): Promise<DatasetResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/dataset/csv`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const detail = payload && typeof payload.detail === "string"
        ? payload.detail
        : `HTTP ${response.status}`;
      throw new Error(detail);
    }

    return (await response.json()) as DatasetResponse;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
