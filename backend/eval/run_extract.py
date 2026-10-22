#!/usr/bin/env python3
"""
Manual end-to-end extraction check.

  python eval/run_extract.py --read-only <files...>   # just dump reader text (no LLM)
  python eval/run_extract.py <files...>                # full: read -> claude -> bundle -> calculate
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import readers  # noqa: E402


def main(argv: list[str]) -> int:
    read_only = "--read-only" in argv
    paths = [Path(a) for a in argv if not a.startswith("--")]
    if not paths:
        print("usage: run_extract.py [--read-only] <file> [<file> ...]")
        return 2

    for p in paths:
        text = readers.read_any(p)
        print(f"\n===== READER OUTPUT: {p.name} ({len(text)} chars) =====")
        print(text[:1500])
        if len(text) > 1500:
            print(f"... [+{len(text) - 1500} more chars]")

    if read_only:
        return 0

    from extractor import extract_from_files
    from calc.engine import calculate

    print("\n===== EXTRACTING via claude CLI ... =====")
    bundle = extract_from_files(paths)
    print(bundle.model_dump_json(indent=2, exclude_none=True))

    print("\n===== CALCULATION =====")
    resp = calculate(bundle)
    for r in resp.results:
        print(f"  [{r.scope}] {r.category} | {r.activity_label} | {r.co2e_t} t | tier={r.tier}")
    print(f"\n  Scope 1 total:           {resp.scope1_total_t} t")
    print(f"  Scope 2 (location-based): {resp.scope2_location_t} t")
    print(f"  Scope 2 (market-based):   {resp.scope2_market_t} t")
    if resp.warnings:
        print("  Warnings:")
        for w in resp.warnings:
            print("   -", w)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
