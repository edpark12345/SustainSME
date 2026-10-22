# STARTING_PROMPT — paste this into Claude Code to set up SustainSME

Open **Claude Code** (desktop app, VS Code/Cursor extension, or CLI) with this folder as the working
directory:

```
<FOLDER_LINK>
```

(This is a SharePoint/OneDrive-synced folder — the local sync path differs per machine/user. Point
Claude at wherever it synced to on *your* machine, e.g. `C:\Users\<you>\Accenture\SME Decarbonization
Asset - SustainSME Live`.)

Then paste this prompt:

---

> Read `SETUP_PROMPT.md` in this folder and follow it to set up and run the SustainSME app on my
> machine, then report status. Don't change any code.
>
> A few things to know before you start:
> - **Don't trust a `backend/.venv` or check whether it's stale** if one already exists in this folder —
>   it's synced from SharePoint, not created fresh by git, so it may hardcode another teammate's Python
>   path and silently fail. Check `backend/.venv/pyvenv.cfg`'s `home =` path against this machine; if it
>   doesn't match, delete and recreate the venv. `SETUP_PROMPT.md` has the exact steps.
> - **If Node.js is missing**, try `winget install --id OpenJS.NodeJS.LTS -e --scope user` first
>   (`--scope user` avoids our org's admin-install block). **If winget hangs for more than ~2 minutes**
>   (known issue on the corporate network — looks stuck, no CPU/network activity), kill it and use the
>   direct-zip fallback documented in `SETUP_PROMPT.md`'s "Node.js install" section instead — no admin
>   rights needed either way.
> - Give me the `http://127.0.0.1:...` links for the frontend and backend once both are running, and
>   flag anything that didn't work.

---

That's the whole thing — `SETUP_PROMPT.md` has full context (what the app is, how the local-LLM
connection works, verification steps) so Claude can self-serve from there.
