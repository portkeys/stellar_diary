# Archive

Content from removed features, kept so it can be revived without a database restore.

## `telescope-tips.json`

The 3 rows of the `telescope_tips` table, exported just before the table was dropped in PR #8 (2026-08-28).

The feature was orphaned when commit `62664a8` replaced the Learn page with My Progress, leaving `TelescopeTips.tsx` unimported and `GET /api/telescope-tips` 404ing in production (the route existed only in the Express dev server, never in `api/index.ts`). PR #8 removed the component, route, storage methods, seed data, and the table.

The most substantial tip — *Collimating Your Apertura AD8 Dobsonian* — is superseded by the `/collimation-guide` page, which covers the same procedure with step-by-step images. The other two are short stubs.

Note `imageUrl: "/collimate_AD8.jpg"` on the first row points at an asset that is no longer in `public/`.
