# Final Submission Story

Updated: 2026-05-28 (codex)

This document freezes the project narrative for the paper, presentation, and live demo. It must stay aligned with `docs/workflow.md`, `docs/progress.md`, benchmark outputs, and the deployed dashboard.

## One-Sentence Claim

The project implements a Cloudflare-deployed multi-agent literature review assistant that turns a research keyword into traceable top-journal paper candidates, verified metadata, ranked results, downloadable reports, and dashboard-visible agent traces.

## Problem Definition

Business-school literature review is slow because researchers must search scholarly databases, filter journals, verify DOI metadata, check open-access availability, rank candidate papers, and prepare review evidence across many disconnected tools.

The target user is a student or researcher preparing an early-stage literature review in management, marketing, accounting, finance, information systems, or related business-school domains.

## Agent Design Rationale

The system is not positioned as a single LLM answer generator. It is positioned as a workflow agent system with explicit roles:

| Stage | Agent role | Implemented status |
| --- | --- | --- |
| 1 | Planner Agent | Implemented |
| 2 | Journal Selector Agent | Implemented |
| 3 | Search/Retriever Agent | Implemented with WoS and OpenAlex fallback |
| 4 | Verifier Agent | Implemented with Crossref enrichment |
| 5 | Open Access Agent | Implemented with Unpaywall metadata |
| 6 | Storage Worker | Implemented for D1/R2 outputs; Google Drive conditional path present |
| 7 | Evaluation Agent | Implemented with metadata scoring |
| 8 | Relevance Agent | Implemented as keyword/metadata scoring by default; Vectorize remains opt-in |
| 9 | Ranking Agent | Implemented |
| 10 | Critic Agent | Implemented as rule-based by default; LLM Critic remains opt-in |
| 11 | Report Agent | Implemented for CSV, Markdown, XLSX, and PDF artifacts |
| 12 | Dashboard Delivery | Implemented |

This architecture is justified because each stage has a different failure mode. Search can fail through poor recall, journal filtering can fail through wrong venue mapping, DOI verification can fail through metadata mismatch, OA discovery can fail through unavailable PDFs, and ranking can fail through weak relevance signals. Separating stages makes these errors visible in agent traces and dashboard diagnostics.

## Implemented System Boundary

The current deployed prototype includes:

- Cloudflare Pages dashboard with Research, Ops, and Evaluation routes.
- Cloudflare Worker backend with search job APIs, diagnostics, report downloads, benchmark snapshot API, and artifact delivery.
- Cloudflare D1 persistence for jobs, papers, evaluations, agent traces, outputs, and related metadata.
- Cloudflare R2 output storage for downloadable report artifacts.
- Read-only Paper Agent MCP endpoint for job, result, output, and diagnostic inspection.
- WoS primary search provider, OpenAlex fallback, Crossref metadata enrichment, and Unpaywall OA enrichment.
- Top-journal allowlist filtering based on the business-school journal list.
- CSV, Markdown, XLSX, and PDF report artifact generation.
- Benchmark scripts and stored outputs for Rule-based, Single-LLM, and Proposed Multi-Agent comparison on the current controlled benchmark layer.

## Partial Or Planned Components

These components must be described as partial or planned, not as final completed claims:

- Vectorize semantic relevance is available as an opt-in path but is not the default fast dashboard path.
- LLM Critic is available as an opt-in path but the stable dashboard path uses rule-based review.
- Google Drive upload is conditional on OA PDF availability and should not be claimed as always executed.
- JCR, SCImago, CiteScore, and FT50 integrations are represented through current journal status fields and planned enrichment, not a full live subscription integration.
- Full 20-task runtime benchmark collection for the Proposed Agent remains pending quota/runtime expansion.

## Benchmark Claim Boundary

The safe benchmark claim is:

- The repository includes a reproducible benchmark structure with at least 20 tasks, gold-label files, baseline result files, Proposed Agent result samples, and scripts for automated evaluation and comparison.
- The current stable comparison layer covers T001-T003 and reports Rule-based, Single-LLM, and Proposed Multi-Agent metrics from repository-controlled CSV/JSON artifacts.
- The benchmark is useful for showing reproducibility and evaluation design, but final performance claims must be phrased carefully until the full 20-task Proposed Agent run is completed.

Do not claim that the Proposed Agent universally outperforms the baselines unless the current benchmark outputs support that statement.

## Dashboard Demo Boundary

The live demo should show:

1. Open the dashboard Research route.
2. Run a keyword search with a conservative max result count.
3. Show job status and the 12-stage trace.
4. Open ranked papers and one paper detail panel.
5. Download CSV, Markdown, XLSX, and PDF artifacts.
6. Open Ops diagnostics to show D1, R2, provider, and readiness status.
7. Open Evaluation to show baseline comparison and implementation status labels.

If an external provider is rate-limited, use an existing completed job ID and artifact downloads as the fallback demo path.

## Professor Evaluation Mapping

| Criterion | Current evidence |
| --- | --- |
| Specific problem definition | Business-school top-journal literature review automation |
| Agent design justification | 12-stage multi-agent workflow with visible traces and role separation |
| Baseline comparison | Rule-based, Single-LLM, and Proposed Multi-Agent benchmark files and comparison scripts |
| Limitations and ethics | Provider quota, journal-list bias, metadata errors, OA access limits, and non-authoritative ranking must be disclosed |
| Reproducibility | GitHub monorepo, documented environment, scripts, API routes, benchmark files, and report artifacts |
| Benchmark quality | DOI-backed gold labels, task files, metric scripts, and automated quality checks |
| Live demo | Cloudflare dashboard, Worker API, D1/R2 artifacts, and MCP read tools |

## Immediate Packaging Tasks

1. Convert `paper/final-paper-draft.tex` into the selected IEEE/ACM/course template.
2. Convert `presentation/final-presentation-outline.md` into an 8-minute slide deck.
3. Use `docs/mcp-latex-ppt-setup.md` to enable LaTeX/PPT MCP only after the local Python/uv/LaTeX prerequisites are verified.
4. Run final dashboard smoke checks and attach the latest job ID in the presentation notes.
5. Keep all updates recorded in `CHANGELOG.md`, `docs/progress.md`, and `docs/debug-log.md` where applicable.
