#!/usr/bin/env python3
"""
main.py — SustainSME FastAPI sidecar.

Local API the React app calls for the real Scope 1 & 2 pipeline:
  POST /api/extract    multipart file(s) -> deterministic read -> `claude` CLI -> ActivityBundle
  POST /api/calculate  ActivityBundle (JSON) -> deterministic emissions -> CalculationResponse
  GET  /api/factors    factor-library metadata (for transparency in the UI)
  GET  /api/ping       health check

Run:  uvicorn main:app --port 8000   (from the backend/ folder)
No Anthropic API key — uses the authenticated local `claude` CLI.
"""
from __future__ import annotations

import datetime
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from schema import ActivityBundle, CalculationResponse
import factors as factor_lib
from extractor import extract_from_files, ExtractionError
from calc.engine import calculate
from export_xlsx import build_xlsx

app = FastAPI(title="SustainSME backend", version="0.1.0")

# The Vite dev server runs on :5173 (and sometimes :5174). Allow localhost.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
def ping() -> dict:
    return {"ok": True, "service": "sustainsme-backend"}


@app.get("/api/factors")
def factors() -> dict:
    return factor_lib.metadata()


@app.get("/api/scope3-buckets")
def scope3_buckets() -> dict:
    """Curated Scope 3 spend buckets (+ categories, currencies) for the entry form."""
    return factor_lib.scope3_buckets()


@app.post("/api/extract", response_model=ActivityBundle)
async def extract(files: list[UploadFile] = File(...), model: str | None = Form(default=None)):
    """Read uploaded documents and return a structured, reviewable ActivityBundle."""
    if not files:
        raise HTTPException(status_code=400, detail="no files uploaded")
    tmpdir = Path(tempfile.mkdtemp(prefix="sustainsme_"))
    saved: list[Path] = []
    try:
        for f in files:
            dest = tmpdir / (f.filename or "upload.bin")
            dest.write_bytes(await f.read())
            saved.append(dest)
        try:
            return extract_from_files(saved, model=model)
        except ExtractionError as e:
            raise HTTPException(status_code=422, detail=str(e))
    finally:
        for p in saved:
            try:
                p.unlink()
            except OSError:
                pass
        try:
            tmpdir.rmdir()
        except OSError:
            pass


@app.post("/api/calculate", response_model=CalculationResponse)
def calculate_endpoint(bundle: ActivityBundle) -> CalculationResponse:
    """Deterministically compute Scope 1 & 2 emissions from a (reviewed) bundle."""
    return calculate(bundle)


@app.post("/api/export.xlsx")
def export_xlsx_endpoint(bundle: ActivityBundle) -> Response:
    """Transparent, screening-grade Excel workbook (summary + per-line calculations + factor register)."""
    calc = calculate(bundle)
    data = build_xlsx(bundle, calc, factor_lib.metadata())
    fname = f"sustainsme_scope_1_2_3_{datetime.date.today().isoformat()}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
