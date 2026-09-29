# TODO — Branching Comic & AI Production Agent

Legend: `[ ]` not started, `[x]` done. Suggested sequence; do not enable unattended publishing before safeguards are complete.

## Milestone 0 — Decisions and accounts
- [ ] Create separate Supabase development and production projects.
- [ ] Create Cloudflare Pages project connected to Git.
- [ ] Decide frontend approach: vanilla JS or Vite.
- [ ] Create an OpenRouter account/API key for programmatic usage.
- [ ] Set a hard OpenRouter spend limit and model allowlist.
- [ ] Select an image-generation provider with API access and commercial-use rights.
- [ ] Decide whether voice/music/video providers are needed for first motion-comic test.
- [ ] Read provider terms for automation, storage, attribution, and commercial publication.
- [ ] Write the content policy, target audience, style bible, and approval rules.

## Milestone 1 — Supabase foundation
- [ ] Apply `schema.sql` in development project.
- [ ] Verify all tables, constraints, indexes, triggers, and RPCs.
- [ ] Bootstrap first admin securely through SQL editor.
- [ ] Test role escalation is impossible for ordinary users.
- [ ] Test RLS as anon, reader, editor, and admin.
- [ ] Create `story-public` and `story-private` Storage buckets.
- [ ] Add Storage policies for public approved media and private media.
- [ ] Decide retention and backup policy.
- [ ] Add seed story with start node, branches, reconverging path, and two endings.
- [ ] Add automated graph validation for missing targets, unreachable nodes, and non-ending dead ends.

## Milestone 2 — Cloudflare Pages app
- [ ] Build story catalog page.
- [ ] Build story detail page with cover, synopsis, status, and available formats.
- [ ] Integrate Supabase Auth sign-up/sign-in/sign-out.
- [ ] Build comic reader with ordered panels, dialog, captions, and mobile layout.
- [ ] Build choice UI that submits a choice ID, never an arbitrary next node ID.
- [ ] Persist current node and choice history.
- [ ] Restore progress after refresh and re-login.
- [ ] Allow switching formats without resetting story progress.
- [ ] Hide format switchers when that format is unavailable.
- [ ] Add not-found, access-denied, loading, and retry states.
- [ ] Add accessibility basics: alt text, keyboard navigation, readable dialog.
- [ ] Add basic admin CRUD for stories, nodes, choices, and assets.
- [ ] Add server-side authorization to all privileged Pages Functions endpoints.

## Milestone 3 — Content model and publishing
- [ ] Define versioned story bible format (characters, visual style, tone, lore).
- [ ] Define script and storyboard JSON schemas.
- [ ] Define panel asset naming and ordering convention.
- [ ] Add asset status lifecycle: draft → generating → review_required → approved → published.
- [ ] Add approval records for outline, script, key art, final episode, and publish.
- [ ] Add preview mode for unpublished content.
- [ ] Add a publish action that checks every required asset is approved and available.
- [ ] Add audit history for editorial changes and approval decisions.

## Milestone 4 — Production agent core
- [ ] Implement durable job runner using Cloudflare Queues/Workflows or equivalent.
- [ ] Use Postgres job rows as the durable source of truth.
- [ ] Implement atomic job claiming/lease/heartbeat to avoid duplicate workers.
- [ ] Add idempotency keys to every generation and upload operation.
- [ ] Add job timeouts and bounded retries with exponential backoff.
- [ ] Add dead-letter/manual-review state after retry exhaustion.
- [ ] Add pause-all switch and per-provider circuit breaker.
- [ ] Add concurrency limit per provider.
- [ ] Add per-job, daily, monthly, and per-project cost caps.
- [ ] Add structured logs with job ID, stage, provider, model, latency, and result status.
- [ ] Never log API keys, bearer tokens, or signed media URLs.
- [ ] Add dashboard for queued/running/failed/waiting-approval jobs.
- [ ] Add alert for stuck jobs, budget threshold, and provider errors.
- [ ] Add a daily cost and production summary.

## Milestone 5 — OpenRouter integration
- [ ] Store OpenRouter API key as a Cloudflare secret.
- [ ] Implement a server-only OpenRouter adapter.
- [ ] Use a configurable allowlist of model IDs; do not let the LLM choose arbitrary models.
- [ ] Set request timeouts, token limits, and bounded retries.
- [ ] Request structured JSON outputs where supported and validate against schemas.
- [ ] Version prompts and record model/provider used.
- [ ] Add fallback model only if explicitly approved and within budget.
- [ ] Track estimated cost and reconcile against provider usage when available.
- [ ] Add prompt-injection defenses: treat briefs, retrieved text, and generated outputs as untrusted data.
- [ ] Ensure agent cannot execute arbitrary shell commands or access arbitrary URLs.
- [ ] Confirm ChatGPT Plus is not being used as API credit; use OpenRouter billing for unattended calls.

## Milestone 6 — Script-to-comic pipeline
- [ ] Generate story brief from approved creative direction.
- [ ] Generate outline and branching graph.
- [ ] Validate every choice target and ensure intended endings are reachable.
- [ ] Generate scripts for each node.
- [ ] Generate panel-by-panel storyboard and image prompts.
- [ ] Run continuity checks against the story bible and prior nodes.
- [ ] Queue human review for story bible, outline, script, and storyboard.
- [ ] Generate comic panels through the selected image provider adapter.
- [ ] Store outputs in private review storage first.
- [ ] Check file type, dimensions, image readability, and expected panel count.
- [ ] Generate alt text and metadata.
- [ ] Move approved assets to public/premium storage according to entitlement policy.
- [ ] Track rejected assets and allow bounded regeneration.

## Milestone 7 — Motion-comic assembly
- [ ] Select deterministic assembly approach (e.g. FFmpeg worker or media rendering service).
- [ ] Implement pan/zoom and transitions from approved panels.
- [ ] Add narration/dialogue audio if licensed and required.
- [ ] Add subtitles/captions and audio levels.
- [ ] Render a low-resolution preview before final export.
- [ ] Validate duration, resolution, audio presence, subtitle sync, and output format.
- [ ] Store output video and poster frame.
- [ ] Require final human approval before publishing.
- [ ] Add video provider adapter only if actual generated video clips are required.
- [ ] Do not assume OpenRouter provides end-to-end video generation.

## Milestone 8 — Signed playback and premium access
- [ ] Decide between YouTube Unlisted for prototype and signed playback provider for premium content.
- [ ] Add server-side entitlement checks.
- [ ] Generate short-lived playback token only after entitlement checks.
- [ ] Keep signing secrets server-side.
- [ ] Avoid exposing private storage paths or permanent video URLs.
- [ ] Test expired token, copied URL, logged-out access, revoked entitlement, and concurrent requests.
- [ ] Document that signed URLs reduce unauthorized reuse but do not prevent screen recording.

## Milestone 9 — Quality and launch
- [ ] Test all graph paths on desktop and mobile.
- [ ] Test progress persistence and switching comic/video formats.
- [ ] Test direct API and Storage access against RLS.
- [ ] Test worker restart during each pipeline stage.
- [ ] Test provider timeout, rate limit, invalid JSON, and insufficient balance.
- [ ] Test cost limit stops new paid jobs.
- [ ] Test approval rejection and revision loop.
- [ ] Test pause-all switch.
- [ ] Deploy production migrations and secrets safely.
- [ ] Publish one short story with 8–12 nodes and 2–3 endings.
- [ ] Invite a small group of testers and collect completion/choice feedback.
- [ ] Review cost per finished episode before increasing concurrency.

## Operational definition of “24/7”
- [ ] Scheduler runs continuously, but only submits jobs when budget, quota, and concurrency allow.
- [ ] Workers can be restarted without losing job state.
- [ ] Failed jobs pause or go to dead-letter; no infinite retries.
- [ ] Human approval is required for public publishing by default.
- [ ] Daily budget and emergency stop are tested before enabling automation.
- [ ] Provider/API outages degrade gracefully and resume when healthy.
