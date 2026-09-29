# Plan — Branching Comic & AI Motion Comic Platform

## 1. Product vision

Build a web platform for interactive branching stories. The first release is a branching comic reader; the same story graph can later render as motion comic/video without duplicating story logic. A production agent orchestrates content production continuously, with explicit approval gates and cost limits.

### Product principles
- One canonical story graph; multiple presentation formats (`comic`, `motion_comic`, `video`).
- Story content and media assets are separate from branching logic.
- Server-side authorization is authoritative; hiding a button in the browser is not security.
- Production automation is a durable job pipeline, not an unbounded autonomous loop.
- Human review is required before publishing public or paid content.
- Every generated asset records its model/provider, prompt version, status, cost estimate/actual cost where available, and rights/source metadata.

## 2. Scope

### MVP
- Public story catalog and story detail pages.
- Supabase Auth: sign-up, sign-in, sign-out, account session.
- Comic reader with ordered panels and dialog/captions.
- Choices that route to the next story node.
- Progress persistence and story history.
- Story/node/asset visibility and entitlement checks.
- Supabase Storage for covers and comic panels.
- Basic admin workflow to create/edit stories, nodes, choices, and assets.
- Responsive mobile-first UI.
- Seed story with at least 8–12 nodes, 2 branches, and 2 endings.
- Cloudflare Pages deployment and Supabase SQL/RLS migrations.

### Phase 2
- Motion-comic format on existing story nodes.
- Video player and subtitle/audio support.
- Cloudflare Stream signed playback tokens or another video host with authenticated playback.
- Story passes/entitlements and payment provider integration.
- AI production job dashboard, approvals, retries, and cost tracking.

### Phase 3
- More than one generation provider.
- Asset variants, localization, voice and sound design.
- Branching analytics and creator tools.
- Scheduled production campaigns and content calendars.

### Explicitly out of scope for first MVP
- Fully autonomous publishing without review.
- Training/fine-tuning a model.
- A visual node-graph editor.
- Complex subscription billing.
- Building a custom streaming server.
- Guaranteeing 24/7 generation without provider quotas, budgets, or failures.

## 3. Recommended stack

- Frontend: Cloudflare Pages; vanilla JavaScript or a small Vite app. Tailwind CDN is acceptable for a prototype, but pin versions and consider a production build when UI complexity grows.
- Server-side endpoints: Cloudflare Pages Functions (or Cloudflare Workers if the pipeline grows beyond Pages).
- Data: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- Authorization: PostgreSQL Row Level Security (RLS), plus server-side checks for privileged operations.
- Media: Supabase Storage for images/audio/subtitles; Cloudflare Stream or equivalent for video when required.
- AI orchestration: Cloudflare Queues + Workers/Workflows or a durable job runner. Store job state in Postgres as the source of truth.
- LLM API: OpenRouter for unattended calls, with provider/model allowlists, budgets, timeouts, and retries.
- Secrets: Cloudflare secrets/environment variables; never expose service-role keys or provider keys to the browser.
- Observability: structured logs, job attempts, failure reason, usage/cost estimates, alerts, and a dead-letter/review queue.

### Important subscription/API distinction
ChatGPT Plus is a ChatGPT product subscription and should not be treated as included API credit for unattended agents. Use an OpenRouter API key and its billing/limits for programmatic model calls. Image/video generation may require separate provider APIs and separate billing; OpenRouter availability is model/provider-specific and does not automatically provide every video-generation capability.

## 4. High-level architecture

1. Browser requests a page from Cloudflare Pages.
2. Supabase Auth establishes the user session.
3. Browser reads public story content through Supabase using the publishable key and RLS.
4. Privileged mutations (admin edits, purchase checks, signing playback tokens, production jobs) go through Pages Functions.
5. PostgreSQL stores story graph, assets, user progress, entitlements, and production job state.
6. Storage holds panel images and related media.
7. A scheduler enqueues due production jobs.
8. Agent workers claim jobs, build prompts from versioned templates, call an allowed provider, validate output, and store results.
9. Generated assets enter `review_required`; a human approves, rejects, or requests revision.
10. Publishing updates content status only after all required checks pass.

## 5. Story runtime

### Story graph
- `stories` contains the series/story.
- `story_nodes` contains each narrative segment.
- `story_choices` contains directed edges to next nodes.
- `story_assets` contains presentation assets for a node, independent of graph edges.
- `story_asset_panels` stores ordered comic panels.
- `user_story_progress` stores current node and choice history.

A node can have comic panels today and a motion-comic video later. Choices reference nodes, not media files. This allows the user to switch format without losing progress.

### Reader behavior
- Load node metadata and only assets the user is allowed to access.
- Render the available format; if a format does not exist, do not show a broken switch.
- Validate each selected choice on the server or through constrained database operations.
- Store choice history and current node atomically where possible.
- Never accept arbitrary `next_node_id` supplied by the client as authority.
- Handle endings and replay/alternate paths explicitly.

## 6. AI production agent

### Goal
Keep a production pipeline working around the clock by processing queued work when capacity and budget are available. “24/7” means the scheduler can run continuously; it does not mean every provider is always available or generation is unlimited.

### Pipeline stages
1. `brief`: create/validate story brief and audience/content constraints.
2. `outline`: draft premise, characters, episode beats, branches, endings.
3. `graph_validation`: verify node references, reachable endings, no unintended dead ends, branch coverage.
4. `script`: generate dialogue, captions, narration, and panel descriptions.
5. `storyboard`: convert script to ordered panel/shot plan.
6. `asset_prompts`: create image prompts and style/character continuity references.
7. `asset_generation`: call an approved image provider; optionally create voice/audio/video through separate providers.
8. `asset_validation`: check expected files, dimensions/duration, text safety, continuity checklist, and technical requirements.
9. `assembly`: compose panels, camera motion, subtitles, audio, transitions, and export via a media worker (e.g. FFmpeg where appropriate).
10. `quality_review`: automated checks and a human review gate.
11. `publish`: upload approved assets and publish the node/story.
12. `analytics`: record production time, completion, cost, and audience outcomes.

### Agent operating rules
- Use a finite state machine and bounded jobs; do not run a free-form infinite agent loop.
- Every job has `max_attempts`, timeout, idempotency key, estimated cost, and status.
- Retry transient errors with exponential backoff and jitter; do not retry validation failures indefinitely.
- Route exhausted jobs to `dead_letter`/manual review.
- Use model/provider allowlists. Do not let generated text choose arbitrary URLs, tools, or providers.
- Enforce per-job, per-story, daily, and monthly spending limits before making paid calls.
- Set concurrency limits to avoid provider rate limits and unexpected spend.
- Store prompt-template versions and model identifiers for reproducibility.
- Keep an audit trail for generated text, prompts, outputs, approval decisions, and publication.
- Do not publish automatically by default. Require a human approval for story canon, images, voices, final video, and paid content.
- Verify commercial-use rights and platform terms for every model, voice, font, music, stock asset, and video provider.
- Do not upload confidential user data to external model providers unless the product policy explicitly permits it.

### Provider strategy
- OpenRouter: LLM tasks such as outline, script, continuity checks, prompt generation, structured JSON output.
- Image generation: a separately approved image API/provider with commercial rights and an API suitable for unattended jobs.
- Voice/music/video: separate providers where needed; verify API access, output rights, pricing, rate limits, and regional availability.
- Assembly: deterministic code/FFmpeg worker, not an LLM.
- Do not assume an OpenRouter text model can generate a finished video. Model and provider capabilities must be explicitly configured.

### Human approval gates
- Gate A: approve story bible and branching outline.
- Gate B: approve scripts and storyboards.
- Gate C: approve character art and key frames.
- Gate D: approve final assembled episode before publication.
- Admin can pause a story, provider, or all generation jobs immediately.

## 7. Security and privacy
- Enable RLS on every table exposed through Supabase APIs.
- Public users can read only published public content and its public assets.
- Users can read/update only their own progress.
- Admin privileges must be based on a server-verified role, not a client-supplied flag.
- Keep Supabase service-role key, OpenRouter key, video signing key, and provider credentials server-side only.
- Validate input sizes and JSON schemas on server endpoints.
- Use signed media URLs or an authenticated media proxy for restricted assets; do not treat unguessable paths as authorization.
- Rate-limit sign-in, generation requests, playback-token requests, and admin actions.
- Keep purchase webhooks idempotent and verify signatures.
- Record access-denied events without logging secret tokens.

## 8. Deployment and operations
- Deploy frontend and Pages Functions from Git.
- Store secrets in Cloudflare settings, not in the repository.
- Apply SQL migrations to Supabase in version control.
- Use separate development and production Supabase projects.
- Configure health checks, error alerts, provider usage alerts, and a daily cost report.
- Back up database and production assets according to an explicit retention policy.
- Keep an operator “pause all jobs” switch and per-provider circuit breakers.
- Document recovery procedures for stuck jobs and provider outages.

## 9. Success metrics
- All story nodes reachable as intended; no broken choice edges.
- Progress survives refresh, logout/login, and format switch.
- No unauthorized private asset can be read through direct storage/API access.
- Generation jobs are idempotent and recover after worker restart.
- Every published episode has an approval record and valid media references.
- Track completion rate, choice distribution, ending discovery, return rate, and cost per published minute.

## 10. Suggested implementation order
1. Database schema, RLS, seed data.
2. Auth and story catalog.
3. Comic reader and branching.
4. Progress persistence.
5. Admin authoring UI.
6. Production job tables and manual job runner.
7. OpenRouter structured-output tasks.
8. Image provider adapter and storage upload.
9. Deterministic assembly pipeline.
10. Review dashboard, publishing, monitoring.
11. Motion-comic playback and signed video access.
12. Entitlements/payment integration.
