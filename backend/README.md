# SustainSME backend (FastAPI)

Local API the React app calls for the real Scope 1 & 2 pipeline:
**upload documents → deterministic read → `claude` CLI structuring → review → deterministic calculation.**
No Anthropic API key — it uses the authenticated local `claude` Code CLI.

## Run

```powershell
# one-time
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# start the API (from the backend/ folder)
.\.venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

Requires the `claude` CLI on PATH (or set `CLAUDE_BIN` to its full path). Override the model with
`SUSTAINSME_MODEL` (default `opus`; `sonnet` is faster/cheaper for testing).

## Endpoints
- `GET  /api/ping` — health check.
- `GET  /api/factors` — factor-library metadata (sources, countries) for the UI's transparency panel.
- `POST /api/extract` — multipart file upload → structured `ActivityBundle` (reviewable).
- `POST /api/calculate` — `ActivityBundle` JSON → `CalculationResponse` (auditable result rows + totals).

## Layout
- `main.py` — FastAPI app + CORS for the Vite dev server.
- `claude_client.py` — `call_json` (text) / `call_json_vision` (Read tool for scanned bills) + JSON salvage/retry.
- `readers.py` — xlsx / text-PDF / docx / csv extraction; image & scanned-PDF detection (vision fallback; optional OCR).
- `extractor.py` — read → prompt → CLI → validate/retry → merge into one bundle.
- `schema.py` — Pydantic canonical schema (mirrored in `app/src/types.ts`).
- `factors.py` + `factors/*.json` — global emission-factor library (sources embedded; swappable).
- `calc/` — deterministic `scope1.py`, `scope2.py`, `engine.py`.
- `prompts/` — system + extraction prompts (`.md`).
- `METHODOLOGY.md` — the calculation spec + Scope 3 design principles.
- `eval/verify_calc.py` — calculator checks (no LLM). `eval/run_extract.py` — manual end-to-end on fixtures.

## Verify
```powershell
.\.venv\Scripts\python.exe eval\verify_calc.py                       # deterministic calc checks
.\.venv\Scripts\python.exe eval\run_extract.py eval\fixtures\bban_ac_master.xlsx   # real extraction (uses claude CLI)
```
