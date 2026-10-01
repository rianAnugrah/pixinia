# Reader, Creator, Admin; author, rating, and reading analytics

Implementation is complete in the workspace. After explicit user authorization, the roles_authors_ratings_reads migration was applied successfully to Preview/Development (avvkbocpqkquzbsvaoeb) and Production (etdjnilavmdugyzufmex) on 2026-10-02 WIB. Production account asnara.dev@gmail.com was promoted to active Admin. Both environments preserve their five existing stories.

## Routes and permissions

- Reader: reading, wallet, personal library and rating; no Studio or Admin navigation.
- Creator: Reader features and `/studio`; only their own stories appear in Studio. Drafts, prose, images, generation jobs, Storage objects and graph RPCs are scoped to their story ownership.
- Admin: `/admin` dashboard, `/admin/users`, `/admin/stories`, `/admin/analytics`, `/admin/coins`. Their Studio list still shows only stories they author. The Admin story list opens any story's Studio editor for management/review.
- Legacy `/admin/stories/:slug/:path*` URLs redirect to `/studio/stories/:slug/:path*` before layout authorization, preserving Creator bookmarks.
- Existing publication workflow remains Admin-only. User role/activation changes and author reassignment use checked RPCs and immutable audit events. The Admin cannot demote/deactivate their own account.

## Data migration

File: `supabase/migrations/20261001164818_roles_authors_ratings_reads.sql`.

- Converts `editor` to `creator`; adds `profiles.is_active`.
- Adds `stories.author_id`, backfilling from `created_by` only when that profile exists.
- Legacy stories without a known owner display `Pixinia Editorial`. They are managed through the Admin story list until an Admin explicitly assigns a Creator. No existing account is arbitrarily made their owner.
- Makes the `story-public` Storage bucket private; the existing reader cover endpoint continues issuing signed URLs for published covers.
- Replaces global staff policy exceptions with ownership checks, including existing paid-content restrictive policies. Copies current graph/image RPCs with explicit ownership guards while retaining validation, pricing and idempotency logic.
- Only `genres`, `tags`, and a validated story-owned `cover_path` can be updated directly. Role, author, publication and coin mutations remain checked operations.

## Rating

`story_ratings` stores one score (1–5) per account/story. `rate_story` requires an active logged-in account, a published public story, a counted reading session, and a different author. Upserting changes the existing score without increasing the rating count. Public pages expose only averages and counts; private reader IDs and ratings are not exposed to other readers or Creators.

## Reading sessions

`reader_touch_session` receives only a node ID, verifies chapter publication/access, and uses server time. Heartbeats run every 5 seconds only while the reader is visible and focused. The server accumulates gaps of at most 15 seconds; hidden/offline gaps are excluded. Blur/visibility/unmount sends `reader_pause_session`, and the first heartbeat after a pause resumes without crediting the gap.

An advisory transaction lock and a single current-session row per account/story serialize parallel tabs and devices. After 30 accumulated active seconds, one session is counted. Repeated requests and chapter changes within a session do not add another read. After 30 minutes without a heartbeat, a new session starts. Total reads count qualified sessions; unique readers count distinct accounts with qualified sessions. Resetting progress does not reset these metrics. Guests and Studio previews are not tracked.

Historical progress is not converted into invented session counts. Tracking starts when this version is released. Browser automation can still imitate heartbeats; this is server-timed deduplication, not a claim to eliminate all bot traffic.

`story_public_metrics` exposes safe author/aggregate projections. `story_analytics` scopes Creator data to their own stories and Admin data to the platform, with 7/30/90/365-day reading filters, format, author, daily activity in WIB, and distinct platform readers. Rating totals cover all time.

## Verification

Final local results: 29 application tests passed; all 20 migrations applied in disposable PostgreSQL; both SQL assertion suites passed; TypeScript and production build passed. Lint passed with one existing `loading-image.tsx` warning. The rollback-based role/RLS/rating/read/Admin SQL suite also passed on both live Supabase databases. Schema checks confirmed profiles.is_active and story_public_metrics exist on both. Security and performance advisors were inspected; their remaining findings include intentionally exposed checked RPCs, existing policy/index optimization suggestions, and disabled leaked-password protection. No authenticated Auth/Storage browser flow was run.

- Application unit/component tests cover role checks, rating eligibility/save/error handling, and heartbeat pause/cleanup in addition to the existing reader/graph tests.
- `supabase/tests/roles-authors-ratings-reads.sql` uses actual `authenticated`/`anon` PostgreSQL roles. It checks cross-author drafts, graph mutations, images, prose, AI jobs, Storage and cover attachment; Reader access; disabled accounts; rating uniqueness/eligibility; reading sessions and hidden-tab pauses; unique users; Creator analytics; Admin promotion, author assignment, audit and coin retry behavior.
- The existing coin-wallet SQL regression suite is updated for `creator` and still runs.
- `scripts/test-roles-database.mjs` builds a disposable in-memory PostgreSQL using PGlite, applies all migrations, seeds content, and runs both SQL suites. It models Supabase Auth/Storage tables and auth UID functions; it does not replace a live Supabase Storage/Auth browser test.

On Windows, to run the disposable database tests without adding a project dependency:

```powershell
$taskTestRuntime = Join-Path $env:TEMP 'pixinia-roles-db-tests'
pnpm --dir $taskTestRuntime add @electric-sql/pglite@0.5.8
node scripts/test-roles-database.mjs (Join-Path $taskTestRuntime 'node_modules/@electric-sql/pglite/dist/index.js')
node --experimental-strip-types --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
node node_modules/next/dist/bin/next build
```

## Application rollout checks

1. Database migration is complete for both Preview/Development and Production.
2. Live rollback SQL assertions and security/performance advisor checks are complete on both environments.
3. Verify authenticated Reader, Creator A, Creator B and Admin flows in the browser, including Supabase Storage upload/signing and real heartbeat timing.
4. Publish a preview using that database after checks pass.
5. Application deployment remains a separate step; this request applied the database migrations. Preserve live author mappings; no rating/read counters are fabricated for old traffic.
