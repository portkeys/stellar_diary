Verify the current change actually works by running StellarDiary and observing real behavior — not just typecheck/build. A clean `tsc` and `vite build` prove the code compiles and bundles; they do NOT prove the running app renders or behaves correctly. Always finish a change by running it.

Run these steps and report a clear PASS/FAIL with evidence.

## 1. Static checks (necessary, not sufficient)

- `npm run check` (tsc) — must exit 0.
- `npm run build:vercel` (vite) — must build successfully.

If either fails, stop and report — no point running a broken build.

## 2. Start a dev server on a CLEAN port

The app's default port is **5000**, but on macOS that port is frequently already taken by **Control Center / AirPlay Receiver** (IPv4) and sometimes a **stale dev server** (IPv6). If you launch on a busy port, `npm run dev` crashes with `EADDRINUSE` — and worse, your smoke tests may silently hit the *pre-existing* server running *old code*, giving a false PASS.

So:

1. Pick a free port (e.g. 5055). Confirm it's free: `lsof -i :5055 -sTCP:LISTEN`.
2. Launch in the background, overriding the port:
   `PORT=5055 npm run dev > /tmp/stellardiary-verify.log 2>&1 &`
3. Wait for readiness without `sleep`:
   `curl -s --retry 40 --retry-connrefused --retry-delay 1 http://localhost:5055/api/health`
4. **Confirm you're testing YOUR server**, not a stale one: the log must say `serving on port 5055`. If the log shows `EADDRINUSE`, the port wasn't free — pick another and retry.

## 3. Smoke-test the API (read-only — never POST/PATCH/DELETE here; it hits the real Neon DB)

Expect HTTP 200 with non-empty bodies:

- `GET /api/health`
- `GET /api/celestial-objects`
- `GET /api/observations`
- `GET /api/apod`
- `GET /api/monthly-guide?hemisphere=Northern`
- `GET /api/telescope-tips`

## 4. Smoke-test the frontend in a real browser (Playwright MCP)

The UI is where component/import regressions actually surface. For each route, navigate and check console **errors**:

`/`, `/monthly-guide`, `/my-observations`, `/my-progress`, `/collimation-guide`, `/admin`

- Use `browser_navigate` then `browser_console_messages` (level: error) per page.
- Take a full-page screenshot of a content-rich page (`/my-progress` is good) and view it to confirm real rendering.
- **Distinguish regressions from pre-existing issues.** Known pre-existing: `/collimation-guide` logs a React `validateDOMNesting` warning (`<a>` inside `<a>` via a wouter `<Link>`) — that is NOT caused by your change. Only flag *new* errors tied to what you modified.

## 5. Tear down and clean up

- Kill ONLY the server you started: `kill $(lsof -ti :5055 -sTCP:LISTEN)`. Leave any pre-existing process on 5000 alone — it may be the user's.
- Remove test artifacts so they don't get committed: the screenshot and `.playwright-mcp/`.
- `git status` should show only your intended change.

## 6. Report honestly

State plainly what you ran and what you observed. If a step was skipped or something failed, say so with the output. "It builds" is not "it works" — only claim verified after the app actually ran and rendered. Call out any pre-existing issues separately from regressions.
