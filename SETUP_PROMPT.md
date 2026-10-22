# SETUP_PROMPT — first-time setup (for a collaborator's Claude)

**Starting prompt to paste into Claude Code (opened in this folder):**

> Read `SETUP_PROMPT.md` in this folder and follow it to set up and run the SustainSME app on my
> machine, then report status. Don't change any code.

Everything Claude needs is below.

---

## Context
SustainSME is an SME carbon-accounting app: a **React frontend** (`app/`) + a **Python FastAPI backend**
(`backend/`). The backend extracts data from uploaded documents via a **local, already-logged-in Claude
Code** and computes Scope 1/2/3 emissions deterministically. **No API keys.** Two processes run locally.

## How the LLM connection works (read this before touching anything)

There's no API key anywhere in this app. The backend gets its "brain" by calling **whatever Claude Code
is already installed and signed in on this machine** — it borrows that login. That means:

- **Any ONE of these three counts** — they all work equally well:
  1. Claude Code **desktop app**, or
  2. Claude Code **VS Code / Cursor extension**, or
  3. Claude Code **CLI** (`claude` in a terminal).
- The backend **auto-discovers** whichever one is present (`_resolve_claude_bin()` in
  `backend/claude_client.py`): it checks PATH first (the CLI), then the install folders of the VS Code/
  Cursor extension and the desktop app, and picks the newest. No manual path configuration needed.
- **A dedicated CLI install is NOT required.** If you already use Claude Code as the desktop app or a
  VS Code/Cursor extension and are signed in, uploads will just work — skip the CLI section entirely.
- The CLI install (below) is only the **fallback for a machine that has none of the three** — it's the
  most explicit/robust option (checked first by auto-discovery), not a mandatory step for everyone.

**So: check what you already have before installing anything.**

## Steps

1. **Read for context:** `CLAUDE.md`, `NEXT_SESSION.md`, `PROJECT_LOG.md`, `EMISSION_METHODOLOGY.md`.

2. **Check for an existing Claude Code login** (don't install anything yet):
   - Ask: do you already use the Claude Code **desktop app**, or the **VS Code/Cursor extension**, or a
     **`claude` CLI**, on this machine — and are you signed in to it?
   - **If yes to any one** → you're done here. Skip straight to step 3 (other prerequisites). The upload
     feature will work via auto-discovery with no further setup.
   - **If no to all three** → go to **"CLI setup (only if you have none of the three)"** below, then
     return here and continue to step 3.

3. **Other prerequisites:** Node.js ≥ 18 and Python ≥ 3.11. If Node is missing, see **"Node.js install"**
   below.

   **⚠️ This folder is a SharePoint/OneDrive-synced folder, not a git clone.** `.gitignore` excludes
   `backend/.venv/` and `app/node_modules/` from *git*, but since there's no git here, these folders
   physically sync between collaborators' machines like any other file. A `.venv` synced from someone
   else's machine looks present but is **broken** — it hardcodes their Python install path. **Before
   trusting an existing `backend/.venv`, check `backend/.venv/pyvenv.cfg`**: if the `home =` path doesn't
   exist on this machine (or isn't yours), delete the whole `.venv` folder and recreate it fresh (step 4).
   `node_modules/` doesn't have this problem (pure JS deps are portable) — `npm install` to confirm it's
   current is enough, no need to delete it first.

4. **Backend** (terminal 1), from `backend/`:
   ```
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe -m uvicorn main:app --port 8000     (or: start-backend.bat)
   ```
   Confirm `http://127.0.0.1:8000/api/ping` returns ok.

5. **Frontend** (terminal 2), from `app/`:
   ```
   npm install
   npm run dev            → http://127.0.0.1:5173
   ```
   (Vite binds to `127.0.0.1`, not `localhost` — use that exact URL.)

6. **Verify end-to-end:**
   - `backend/eval/verify_calc.py` → should print **ALL CHECKS PASSED**.
   - `npm run build` → clean (no type errors).
   - In the browser: a quick Scope 2 entry → **Calculate** → a tCO₂e figure with a cited factor.
   - Optional: upload a sample bill and confirm the extracted data appears for review (exercises
     whichever Claude Code login was found).

7. **Don't change any code** — set it up and report what worked / any errors.

---

## CLI setup (only if you have none of the three — skip otherwise)

Use this **only** if step 2 found no existing Claude Code login at all. This installs the standalone
CLI via the **native installer — no Node.js required** for this part (Node is still needed later, for
the frontend in step 5).

1. **Install (PowerShell, no Node.js needed):**
   ```
   irm https://claude.ai/install.ps1 | iex
   ```
   This installs a standalone `claude` to `%USERPROFILE%\.local\bin`. Re-check with `claude --version`
   (open a fresh terminal if it's not found — PATH updates on new sessions). If it's still not on PATH,
   use the full path `%USERPROFILE%\.local\bin\claude.exe` as `CLAUDE_BIN` later.

2. **Log in:** run `claude auth login` (or start `claude` and use `/login`) and complete sign-in in the
   browser.

3. **Verify it works headlessly** (the backend uses print mode, not the interactive chat):
   `claude -p "reply with OK" --output-format json` → expect a JSON result with an `"result"` field.

4. **If you see "organization requires remote managed settings to load"** (common on Accenture
   machines): close any running `claude` / Claude Desktop, delete the stale files
   `~/.claude/.credentials.json` and `~/.claude/remote-settings.json`, then run `claude auth login`
   **in a normal Windows Terminal** (a Desktop-app re-login does **not** fix this), and re-test step 3.
   If it still fails, stop and report.

5. **Optional env overrides:** `SUSTAINSME_MODEL` (default `opus`), `CLAUDE_BIN` (explicit path — wins
   over auto-discovery if set).

Return to **step 3** above once this verifies.

## Node.js install (only if step 3 found none)

Accenture machines typically **block admin-scoped app installs**, and winget on the corporate network can
**hang indefinitely** (looks stuck at 0% CPU, no network activity — likely proxy/firewall related, not a
real prompt). Try in this order:

1. **winget, user-scope, with a timeout:**
   ```
   winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements --scope user
   ```
   `--scope user` avoids the admin-install block. **If this doesn't finish within ~2 minutes, don't wait
   longer — kill the `winget` process and go to step 2.** (A run with no `--scope user` may also silently
   wait on a machine-scope elevation prompt that never appears in a non-interactive shell — same fix:
   kill it, retry with `--scope user`, then fall back below if it still hangs.)

2. **Fallback — direct zip, no installer, no admin:**
   ```powershell
   # get the current LTS version string
   $lts = (Invoke-WebRequest "https://nodejs.org/dist/index.json" -UseBasicParsing | ConvertFrom-Json | Where-Object lts | Select-Object -First 1).version
   $zip = "$env:LOCALAPPDATA\Programs\node-$lts-win-x64.zip"
   Invoke-WebRequest "https://nodejs.org/dist/$lts/node-$lts-win-x64.zip" -OutFile $zip
   Expand-Archive $zip "$env:LOCALAPPDATA\Programs" -Force
   Remove-Item $zip
   $nodeDir = "$env:LOCALAPPDATA\Programs\node-$lts-win-x64"
   [Environment]::SetEnvironmentVariable("Path", "$([Environment]::GetEnvironmentVariable('Path','User'));$nodeDir", "User")
   $env:Path += ";$nodeDir"   # for the current session too
   node --version; npm --version
   ```
   This is the same approach that worked on `priyank.e.jain`'s machine (2026-08-07) after winget hung.
   A brand-new terminal picks up the PATH change automatically; the current session needs the last
   `$env:Path` line.

3. Any Node ≥ 18 LTS works either way — just confirm `node --version` / `npm --version` before step 5.

## Conventions (once building)
- Log **every** change in `PROJECT_LOG.md` (dated entry).
- Keep `backend/schema.py` ↔ `app/src/types.ts` **in sync**.
- Factors are cited JSON in `backend/factors/`; calculators in `backend/calc/` are deterministic.
- The LLM is a local, already-logged-in Claude Code only (`backend/claude_client.py`) — never add API keys.
- Branding: Accenture purple, no bank name; UI strings in English.
