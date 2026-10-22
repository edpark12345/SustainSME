#!/usr/bin/env python3
"""
extractor.py — turn uploaded documents into a structured ActivityBundle.

Pipeline: deterministic read (readers.py) -> build prompt from prompts/*.md ->
`claude` CLI with the ActivityBundle JSON schema -> validate -> retry once with
the validation error fed back. No emissions are computed here.
"""
from __future__ import annotations

from pathlib import Path

from pydantic import ValidationError

import claude_client as cc
import readers
from schema import ActivityBundle, extraction_json_schema

_PROMPTS = Path(__file__).resolve().parent / "prompts"


class ExtractionError(RuntimeError):
    pass


def _load(name: str) -> str:
    return (_PROMPTS / name).read_text(encoding="utf-8")


def _is_vision_marker(text: str) -> bool:
    return text.lstrip().startswith(("[SCANNED", "[IMAGE FILE"))


def _validate(raw: dict, system: str, user: str, schema: dict, kwargs: dict,
              vision: dict | None = None) -> ActivityBundle:
    """Build an ActivityBundle, with one corrective retry on schema-validation failure."""
    try:
        return ActivityBundle(**raw)
    except ValidationError as ve:
        retry_system = system + (
            "\n\nYour previous output FAILED schema validation with these errors:\n"
            + str(ve) + "\nReturn corrected JSON that conforms exactly to the schema."
        )
        if vision:
            raw2 = cc.call_json_vision(retry_system, user, schema, vision["allow_dir"], **kwargs)
        else:
            raw2 = cc.call_json(retry_system, user, schema, **kwargs)
        return ActivityBundle(**raw2)


def _merge(bundles: list[ActivityBundle]) -> ActivityBundle:
    merged = ActivityBundle()
    for b in bundles:
        if b.boundary and (b.boundary.sites or b.boundary.reporting_year):
            # keep the richest boundary; prefer one that names sites
            if not merged.boundary.sites:
                merged.boundary = b.boundary
            else:
                merged.boundary.sites.extend(s for s in b.boundary.sites if s not in merged.boundary.sites)
        merged.scope2_electricity += b.scope2_electricity
        merged.scope2_thermal += b.scope2_thermal
        merged.scope1_stationary += b.scope1_stationary
        merged.scope1_mobile += b.scope1_mobile
        merged.scope1_fugitive += b.scope1_fugitive
    return merged


def extract_from_files(paths: list[Path], model: str | None = None) -> ActivityBundle:
    system = _load("00_system.md")
    schema = extraction_json_schema()
    kwargs = {"model": model} if model else {}
    bundles: list[ActivityBundle] = []

    text_chunks: list[str] = []
    vision_paths: list[Path] = []
    for p in paths:
        text = readers.read_any(p)
        if _is_vision_marker(text):
            vision_paths.append(p)
        else:
            text_chunks.append(f"===== FILE: {p.name} =====\n{text}")

    # Text-extractable documents: one batched structuring call.
    if text_chunks:
        user = _load("extract_generic.md").replace("{{DOCUMENTS}}", "\n\n".join(text_chunks))
        try:
            raw = cc.call_json(system, user, schema, **kwargs)
        except cc.ClaudeError as e:
            raise ExtractionError(f"LLM extraction failed: {e}")
        bundles.append(_validate(raw, system, user, schema, kwargs))

    # Scanned / image documents: one vision call each (Read tool opens the file).
    vis_template = _load("extract_vision.md")
    for p in vision_paths:
        user = vis_template.replace("{{PATH}}", str(p.resolve()))
        try:
            raw = cc.call_json_vision(system, user, schema, str(p.resolve().parent), **kwargs)
        except cc.ClaudeError as e:
            raise ExtractionError(f"LLM vision extraction failed for {p.name}: {e}")
        bundles.append(_validate(raw, system, user, schema, kwargs,
                                 vision={"allow_dir": str(p.resolve().parent)}))

    if not bundles:
        raise ExtractionError("No documents could be read.")
    return _merge(bundles)
