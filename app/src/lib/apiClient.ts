// Typed client for the SustainSME FastAPI backend (Scope 1 & 2 pipeline).
import type {
  ActivityBundle,
  CalculationResponse,
  FactorMeta,
  Scope3BucketsResponse,
} from '../types';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

/** Default request timeout (ms). The backend calc is fast; anything slower
 * usually means the backend is down or wedged, so fail loudly instead of
 * hanging the UI spinner forever. */
const TIMEOUT_MS = 30_000;

/** fetch() with an AbortController timeout and a clear, user-facing error. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. Is the backend running? ` +
          `Start it with backend/start-backend.bat and try again.`,
      );
    }
    throw new Error(
      `Could not reach the backend at ${BASE}. Start it with ` +
        `backend/start-backend.bat and try again.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async ping(): Promise<boolean> {
    try {
      // Short timeout: a health check should fail fast, not hang the banner.
      const res = await fetchWithTimeout(`${BASE}/api/ping`, {}, 4_000);
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Upload one or more documents; backend reads + LLM-structures them. */
  async extract(files: File[]): Promise<ActivityBundle> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    // Extraction may run an LLM pass over documents — allow more headroom.
    const res = await fetchWithTimeout(`${BASE}/api/extract`, { method: 'POST', body: form }, 120_000);
    return asJson<ActivityBundle>(res);
  },

  /** Deterministically compute Scope 1 & 2 from a (reviewed) bundle. */
  async calculate(bundle: ActivityBundle): Promise<CalculationResponse> {
    const res = await fetchWithTimeout(`${BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle),
    });
    return asJson<CalculationResponse>(res);
  },

  async factors(): Promise<FactorMeta> {
    const res = await fetchWithTimeout(`${BASE}/api/factors`);
    return asJson<FactorMeta>(res);
  },

  /** Curated Scope 3 spend buckets (+ categories, currencies) for the entry form. */
  async scope3Buckets(): Promise<Scope3BucketsResponse> {
    const res = await fetchWithTimeout(`${BASE}/api/scope3-buckets`);
    return asJson<Scope3BucketsResponse>(res);
  },

  /** Download the full calculation as an auditable Excel workbook. */
  async exportXlsx(bundle: ActivityBundle): Promise<void> {
    const res = await fetchWithTimeout(`${BASE}/api/export.xlsx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle),
    });
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const b = await res.json();
        if (b?.detail) detail = typeof b.detail === 'string' ? b.detail : JSON.stringify(b.detail);
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sustainsme_scope_1_2_3.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const API_BASE = BASE;
