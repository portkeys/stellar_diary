# StellarDiary — Project Status & Tech Debt

> **Last Updated:** 2026-06-20
> Tracks what's shipped, known tech debt from codebase audits, and cleanup status.
> For *feature* ideas, see [IDEAS.md](./IDEAS.md). For deploy details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## ✅ Recently Shipped

- **Codebase cleanup (2026-06-20):** removed dead deps (`axios` + unused auth stack, 31 npm
  packages), 2 leftover Python files, and 31 unused shadcn/ui components. Typecheck + build green.
- Allow repeat observations per object; add constellation/satellite object types (#3)
- My Progress page: GitHub-style activity heatmap (replaced calendar), single-gold solid cells
- Mobile APOD overlay fix, lazy-loaded YouTube video, search on Monthly Guide
- Auto-populate monthly sky guides (YouTube Data API integration)
- Data-driven My Progress page (replaced Learn page)
- Messier catalog scripts with 2MASS atlas images
- Vercel migration complete with custom domain (stellardiary.org)

---

## 🧹 Codebase Audit — Tech Debt

Findings from the 2026-06-20 audit, ordered by impact.

### 1. Backend + schema duplication 🔴 *(open — highest impact)*

The backend is maintained **twice**:

- `server/routes.ts` (~870 lines, local Express dev) and `api/index.ts` (~1,374 lines, Vercel
  serverless) define overlapping routes (`/api/apod`, `/api/observations`, `/api/celestial-objects`,
  `/api/monthly-guide`, admin endpoints).
- `api/index.ts` **re-declares the DB schema inline** instead of importing `shared/schema.ts`
  (comment: "Vercel can't resolve imports from outside /api"). The copies have already drifted —
  **7 tables in `shared/schema.ts` vs 5 in `api/index.ts`**.

**Risk:** every route/column change must be made in two places by hand; nothing enforces parity.
`shared/schema.ts` is described as the "single source of truth" but currently is not.

**Proposed fix:** make the Vercel function bundle/import the shared schema (esbuild bundling or a
shared module path), then collapse the two backends into one. Largest single cleanup available.

### 2. Dead dependencies ✅ *(removed 2026-06-20)*

Never imported anywhere in the codebase:

- `axios` — code uses native `fetch`.
- Auth stack: `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`
  (+ their `@types`). Auth is not implemented; infra was installed but unused.

### 3. Leftover Python files ✅ *(removed 2026-06-20)*

- `server/services/fetch_apod.py`, `server/services/nasa_images.py` — replaced by Node services
  back on 2026-01-08 but left in the tree.

### 4. Unused UI components ✅ *(removed 2026-06-20)*

- 31 of 47 shadcn/ui components were never imported. Deleted them; **kept `label`** (imported
  transitively by `form`, which is in use). 16 components remain.

### 5. Orphaned UI packages 🟡 *(open — follow-up to #4)*

After deleting the unused UI components, these npm packages are no longer referenced and could be
removed in a follow-up (left in place for now to keep the cleanup scoped):

`recharts` (chart), `embla-carousel-react` (carousel), `vaul` (drawer), `react-day-picker`
(calendar), `input-otp`, `react-resizable-panels` (resizable), and the `@radix-ui/*` packages tied
to the deleted components. Verify each against the build before removing.

### 6. Image-service layering 🟡 *(open)*

Three things did image search: `nasaImages.ts` → wraps `nasaImagesNode.ts`, plus the (now deleted)
`nasa_images.py`. Collapse `nasaImages.ts` / `nasaImagesNode.ts` into one module.

---

## 🗺️ Roadmap

See [IDEAS.md](./IDEAS.md) for feature ideas (calendar view, Monthly Guide refactor, Messier
challenge progress tracking).

**Tech-debt roadmap (this doc):**
1. Unify the dual backend + single-source schema (#1) — highest leverage.
2. Remove orphaned UI packages (#5).
3. Consolidate image services (#6).
