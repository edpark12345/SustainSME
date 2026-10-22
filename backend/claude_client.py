#!/usr/bin/env python3
"""
claude_client.py — headless LLM transport for SustainSME (local, no API key).

Invokes the already-authenticated `claude` Code CLI in headless mode. This is a
faithful port of the proven pattern used in the Sandoz UAT and STEP kits:

  - `claude -p --output-format json --json-schema <schema>` returns a JSON
    envelope; the schema-validated object is in `structured_output`.
  - The system prompt is passed via a temp file (`--system-prompt-file`) to dodge
    Windows command-line length limits; the user prompt is sent on stdin.
  - Transient failures (overload / 429 / 5xx / timeout) are retried with backoff.
  - If `structured_output` is absent, salvage JSON from the `result` text,
    tolerant of markdown fences and truncation.

No Anthropic API key is required — the CLI uses the existing Claude Code auth.
"""
from __future__ import annotations

import glob
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

def _resolve_claude_bin() -> str:
    """Locate a usable `claude` executable so the backend "just works" on any
    machine that has Claude Code installed — no hardcoded username or version.

    Resolution order:
      1. explicit CLAUDE_BIN env var (wins verbatim — the documented override),
      2. `claude` on PATH (i.e. the standalone CLI, if installed),
      3. the binary bundled with an installed Claude Code — the VS Code / Cursor
         extension or the desktop app — newest version if several are present,
      4. fall back to the bare name 'claude' (so a missing install still raises a
         clear FileNotFoundError, exactly as before).

    Everything in step 3 is derived from %USERPROFILE% / %APPDATA% /
    %LOCALAPPDATA% (and ~ elsewhere); the version is read from the path, so an
    extension auto-update can never make the path go stale.
    """
    env = os.environ.get("CLAUDE_BIN")
    if env:
        return env

    on_path = shutil.which("claude")
    if on_path:
        return on_path

    home = Path(os.path.expanduser("~"))
    appdata = os.environ.get("APPDATA", str(home / "AppData" / "Roaming"))
    localappdata = os.environ.get("LOCALAPPDATA", str(home / "AppData" / "Local"))
    exe = "claude.exe" if os.name == "nt" else "claude"

    patterns = [
        # IDE extension bundles (VS Code, VS Code Insiders, Cursor)
        str(home / ".vscode" / "extensions" / "anthropic.claude-code-*" / "resources" / "native-binary" / exe),
        str(home / ".vscode-insiders" / "extensions" / "anthropic.claude-code-*" / "resources" / "native-binary" / exe),
        str(home / ".cursor" / "extensions" / "anthropic.claude-code-*" / "resources" / "native-binary" / exe),
        # Desktop app installs: older builds use claude-code/<ver>/, newer ones claude-code/<ver>/<hash>/
        str(Path(appdata) / "Claude" / "claude-code" / "*" / exe),
        str(Path(appdata) / "Claude" / "claude-code" / "*" / "*" / exe),
        str(Path(localappdata) / "Packages" / "Claude_*" / "LocalCache" / "Roaming" / "Claude" / "claude-code" / "*" / exe),
        str(Path(localappdata) / "Packages" / "Claude_*" / "LocalCache" / "Roaming" / "Claude" / "claude-code" / "*" / "*" / exe),
    ]
    candidates: list[str] = []
    for pat in patterns:
        candidates.extend(glob.glob(pat))

    def _version_key(path: str):
        vers = re.findall(r"(\d+)\.(\d+)\.(\d+)", path)
        best = max((tuple(map(int, m)) for m in vers), default=(0, 0, 0))
        try:
            mtime = os.path.getmtime(path)
        except OSError:
            mtime = 0.0
        return (best, mtime)

    if candidates:
        return max(candidates, key=_version_key)

    return "claude"


CLAUDE_BIN = _resolve_claude_bin()
DEFAULT_MODEL = os.environ.get("SUSTAINSME_MODEL", "opus")
CALL_TIMEOUT = int(os.environ.get("SUSTAINSME_CALL_TIMEOUT", "900"))
RETRIES = int(os.environ.get("SUSTAINSME_RETRIES", "2"))


class ClaudeError(RuntimeError):
    pass


def _diagnose(proc: subprocess.CompletedProcess) -> str:
    err = (proc.stderr or "").strip()
    if err:
        return err[:800]
    out = (proc.stdout or "").strip()
    try:
        env = json.loads(out)
        return (env.get("result") or env.get("subtype") or out)[:800]
    except Exception:
        return out[:800] or "(claude produced no output)"


def _is_transient(env: dict) -> bool:
    st = env.get("api_error_status")
    if isinstance(st, int) and (st == 429 or st >= 500):
        return True
    blob = f"{env.get('subtype', '')} {env.get('result', '')}".lower()
    return any(
        k in blob
        for k in (
            "overloaded", "rate limit", "rate_limit", "timeout", "temporarily",
            "try again", "529", "503", "502", "500", "connection",
        )
    )


def call_json(
    system_prompt: str,
    user_prompt: str,
    schema: dict,
    model: str = DEFAULT_MODEL,
    timeout: int = CALL_TIMEOUT,
    retries: int = RETRIES,
) -> dict:
    """Text-only structured call. Tools disabled; user prompt on stdin."""
    cmd = [
        CLAUDE_BIN, "-p",
        "--tools", "",
        "--output-format", "json",
        "--no-session-persistence",
        "--json-schema", json.dumps(schema),
        "--model", model,
    ]
    return _run(cmd, system_prompt, user_prompt, timeout, retries)


def call_json_vision(
    system_prompt: str,
    user_prompt: str,
    schema: dict,
    allow_dir: str,
    model: str = DEFAULT_MODEL,
    timeout: int = CALL_TIMEOUT,
    retries: int = RETRIES,
) -> dict:
    """Vision structured call: enable the Read tool so the model can open a
    scanned PDF / image referenced (by absolute path) in the user prompt.
    `allow_dir` is granted to tool access via --add-dir."""
    cmd = [
        CLAUDE_BIN, "-p",
        "--allowedTools", "Read",
        "--add-dir", allow_dir,
        "--output-format", "json",
        "--no-session-persistence",
        "--json-schema", json.dumps(schema),
        "--model", model,
    ]
    return _run(cmd, system_prompt, user_prompt, timeout, retries)


def _run(base_cmd: list[str], system_prompt: str, user_prompt: str,
         timeout: int, retries: int) -> dict:
    """Shared subprocess + envelope parsing + transient retry for both call types.

    The system prompt is written to a temp file and appended via
    --system-prompt-file; the user prompt is sent on stdin.
    """
    sysf = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8")
    try:
        sysf.write(system_prompt)
        sysf.close()
        cmd = base_cmd + ["--system-prompt-file", sysf.name]
        last = "unknown error"
        for attempt in range(retries + 1):
            try:
                proc = subprocess.run(
                    cmd, input=user_prompt, capture_output=True, text=True,
                    encoding="utf-8", errors="replace", timeout=timeout,
                )
            except subprocess.TimeoutExpired:
                last = f"timed out after {timeout}s"
                if attempt < retries:
                    time.sleep(3 * (attempt + 1)); continue
                raise ClaudeError(f"claude CLI {last}")

            if proc.returncode != 0:
                last = f"exited {proc.returncode}: {_diagnose(proc)}"
                if attempt < retries:
                    time.sleep(3 * (attempt + 1)); continue
                raise ClaudeError(f"claude CLI {last}")

            try:
                env = json.loads(proc.stdout)
            except json.JSONDecodeError:
                last = f"unparseable output: {(proc.stdout or proc.stderr)[:400]}"
                if attempt < retries:
                    time.sleep(3); continue
                raise ClaudeError(f"claude CLI {last}")

            if env.get("is_error"):
                detail = env.get("result") or env.get("subtype") or "unknown error"
                last = f"reported an error [{env.get('subtype', '')}]: {detail}"
                if attempt < retries and _is_transient(env):
                    time.sleep(3 * (attempt + 1)); continue
                raise ClaudeError(f"claude {last}")

            so = env.get("structured_output")
            if so is not None:
                return so
            # Schema not surfaced — salvage JSON from the result text.
            txt = (env.get("result") or "").strip()
            try:
                return extract_json_object(txt)
            except Exception:
                last = f"no structured output; result was: {txt[:300]}"
                if attempt < retries:
                    time.sleep(2); continue
                raise ClaudeError(f"claude {last}")
        raise ClaudeError(f"claude CLI failed after {retries + 1} attempts: {last}")
    finally:
        try:
            os.unlink(sysf.name)
        except OSError:
            pass


# ── JSON salvage helpers (tolerant of fences / truncation) ──────────────────
def _strip_fences(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        nl = t.find("\n")
        if nl != -1:
            t = t[nl + 1:]
        if t.rstrip().endswith("```"):
            t = t.rstrip()[:-3]
    return t.strip()


def _extract_balanced(text: str, opener: str, closer: str):
    t = _strip_fences(text)
    start = t.find(opener)
    if start == -1:
        raise ClaudeError(f"no JSON {opener}…{closer} found in model reply")

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(t)):
        ch = t[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
            if depth == 0:
                return json.loads(t[start:i + 1])

    # Truncated — repair by closing open strings/brackets.
    s = t[start:]
    stack = []
    in_str = False
    esc = False
    for ch in s:
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            stack.append("}")
        elif ch == "[":
            stack.append("]")
        elif ch in "}]":
            if stack:
                stack.pop()
    if in_str:
        s += '"'
    s = s.rstrip()
    while s.endswith(","):
        s = s[:-1].rstrip()
    while stack:
        s += stack.pop()
    return json.loads(s)


def extract_json_object(text: str):
    """First balanced top-level {...} object, tolerant of fences/truncation."""
    return _extract_balanced(text, "{", "}")


def extract_json_array(text: str):
    """First balanced top-level [...] array, tolerant of fences/truncation."""
    return _extract_balanced(text, "[", "]")
