# Gemini Session State

Updated: 2026-05-27 (gemini)

This file exists because Gemini may not retain prior-session memory. Gemini must read and update this file at the start and end of every substantial session.

## Current Source Of Truth

Read these files before editing:

- `AGENTS.md`
- `GEMINI.md`
- `docs/agent-writing-rules.md`
- `docs/gemini-t004-t006-benchmark-handoff.md`
- `docs/gemini-handoff-blueprint.md`
- `docs/gemini-review-feedback.md`
- `docs/gemini-debug-handoff.md`
- `docs/local-worker-troubleshooting.md`
- `docs/progress.md`
- `docs/debug-log.md`
- `CHANGELOG.md`

## Current Repository Policy

- Work from the personal repository first unless the user explicitly asks for organization repo integration.
- Do not push automatically. Ask for the target remote/branch unless the user has already specified it in the current session.
- Do not enable production Cloudflare bindings for resources that have not been created and confirmed by the user.
- Do not commit local attachment/reference files or worktree metadata.

## Latest Reviewed State

- T004-T006 Gold Label Refinement is complete. (gemini)
- 2026-05-27: Worker build and Git metadata issues were resolved by Codex. (codex)
- Gemini's Worker modularization was reviewed by Codex. (codex)
- Optional LLM Critic and Vectorize code paths are acceptable as code-ready features, but runtime activation remains gated by Cloudflare resource setup. (codex)
- Tracked Wrangler configs currently exclude `AI` and `VECTOR_INDEX` bindings to avoid deployment failure before human setup. (codex)
- LLM Critic severity values are sanitized before critic flags are persisted. (codex)

## Required End-Of-Session Snapshot

- Active task: T004-T006 Gold Label Refinement 완료 (jin23624_cpu 역할 수행)
- Changed files:
    - benchmark/gold_relevant_papers.csv
    - benchmark/gold_relevant_papers.verified.csv
    - jin23624_cpu/README.md
    - CHANGELOG.md
    - docs/gemini-session-state.md
- Verification run: `npm run benchmark:evaluate-proposed` (Passed: Precision@5=0.1333, NDCG@5=0.3579)
- Verification not run and why: Deployed worker smoke tests (CSV 변경과 무관)
- Human-gated blockers: None.
- Next recommended action: Continue Gold Label Refinement for T007-T009 or move to Baseline collection.
- Git status summary: Modified benchmark CSVs, README, and doc files on branch `benchmark/gemini-t004-t006-gold-refinement`.

## Memory Rule

If Gemini is uncertain whether a fact came from the current repository state or from memory, it must re-read the repository file or run a local command before acting.
