# Integrated Workflow Design

Source document: `AI_Agent_프로젝트_전체_통합본.pdf`

This document reflects the integrated project report into the implementation roadmap. The target system is a top-journal-aware literature review assistant, not a generic paper search tool.

## Product Definition

The project goal is an AI Agent system for automated scholarly paper discovery, journal quality screening, metadata verification, ranking, comparison, and report generation.

Core principle:

```text
Return fewer but more trustworthy papers:
real papers, verified metadata, allowlisted or high-quality journals, topic relevance, and auditable reasons.
```

Primary user:

```text
Graduate students and researchers preparing a literature review or early-stage research proposal.
```

## Target End-To-End Workflow

```text
User
-> Cloudflare Pages dashboard
-> Cloudflare Workers API / agent workflow
-> Planner Agent
-> Journal Selector Agent
-> Search/Retriever Agent
-> Verifier Agent
-> OA Download Agent
-> Journal Evaluation Agent
-> Relevance Evaluation Agent
-> Ranking Agent
-> Summarizer Agent
-> Comparator Agent
-> Critic Agent
-> Report Agent
-> D1 / R2 / Drive / Vectorize
-> User downloads outputs
```

## Agent Responsibilities

| Agent | Responsibility | Current Status |
| --- | --- | --- |
| Planner Agent | Convert user topic into keywords, sub-questions, field classification, and year/result constraints. | Partial: keyword input and search job creation exist. |
| Journal Selector Agent | Select top journal universe by field using allowlist, ISSN, FT50/ABS/JCR/SCImago/CiteScore criteria. | Partial: business school journal allowlist exists. |
| Search/Retriever Agent | Retrieve candidate papers from approved scholarly APIs. | Blocked for WoS until `WOS_API_KEY`; previous stored D1 jobs can be reviewed. |
| Verifier Agent | Verify DOI, title, year, journal, authors, publisher, and ISSN with Crossref. | Partial: DOI-backed Crossref enrichment and verification exist. |
| OA Download Agent | Check Unpaywall, store OA URLs, and later upload allowed OA PDFs to Google Drive. | Partial: Unpaywall metadata exists; Drive upload not implemented. |
| Journal Evaluation Agent | Score journal quality using allowlist, top journal status, Q1/JCR/SCImago/CiteScore/FT50/ABS. | Partial: allowlist pass currently maps to journal fit score. |
| Relevance Evaluation Agent | Score title/abstract similarity against the user topic and explain inclusion. | Partial: keyword-overlap score exists; embedding/Vectorize not implemented. |
| Ranking Agent | Combine relevance, journal quality, verification, OA availability, citation count, and recency. | Partial: persisted component scores and final score exist; formula needs refinement. |
| Summarizer Agent | Summarize research question, theory, method, data, and findings. | Not implemented. |
| Comparator Agent | Compare each paper with the user topic and identify commonality, difference, and research gap. | Not implemented. |
| Critic Agent | Recheck metadata, journal match, relevance, hallucination risk, and unsupported claims. | Not implemented. |
| Report Agent | Generate PDF/Excel/Markdown/CSV outputs and store them in R2. | Partial: CSV and Markdown reports stored in R2. |

## Workflow Stages

| Stage | Task | Primary Store / Output | Implementation Target |
| --- | --- | --- | --- |
| 1 | User enters keyword/topic | Dashboard state | Implemented |
| 2 | Create search job | D1 `search_jobs` | Implemented |
| 3 | Select field and journal universe | D1 / shared allowlist | Partial |
| 4 | Search candidate papers | External API results | Blocked by WoS approval |
| 5 | Verify DOI and bibliography | D1 `papers` Crossref fields | Partial |
| 6 | Check OA availability | D1 Unpaywall fields | Implemented |
| 7 | Store OA PDF in Drive | Drive file ID / URL | Not implemented |
| 8 | Persist paper metadata | D1 `papers` | Implemented |
| 9 | Evaluate journal quality | D1 `evaluations` | Partial |
| 10 | Evaluate relevance | D1 `evaluations` / Vectorize | Partial |
| 11 | Rank and critic-review | D1 scores and reasons | Partial |
| 12 | Generate outputs | R2 CSV/Markdown now; PDF/XLSX later | Partial |

## Data Architecture

| Store | Use | Current State |
| --- | --- | --- |
| Cloudflare D1 | Search jobs, papers, verification fields, OA metadata, evaluation scores. | Implemented and healthy. |
| Cloudflare R2 | Final output files and durable report artifacts. | Implemented for `papers.csv` and `report.md`. |
| Cloudflare Vectorize | Abstract/topic embeddings and semantic similarity search. | Planned. |
| Google Drive | OA PDF originals for team review. | Planned. |

R2 should not become the operational metadata database. Search, filtering, ranking, and job state must remain in D1.

## Output Standard

Final report outputs should include:

- Rank
- Title, authors, year
- Journal and top journal or Q1 status
- DOI and verification status
- Abstract/topic relevance score
- Journal quality score
- Citation and recency scores
- OA status and PDF/link availability
- Summary of research question, theory, method, data, and findings
- Commonality with user topic
- Difference from user topic
- Research gap
- Critic note and exclusion/review reason

Current outputs:

- CSV: persisted metadata, OA fields, score components, final score, inclusion status.
- Markdown: executive summary, ranked table, paper details, OA links, license, score breakdown.

Planned outputs:

- `report.pdf`
- `papers.xlsx`

## Evaluation Plan

Benchmarks should compare:

1. Rule-based keyword search baseline
2. Single LLM recommendation baseline
3. Proposed top-journal-aware agent workflow

Core metrics:

- Precision@5
- Paper validity rate
- DOI accuracy
- Top journal precision
- Hallucination rate
- OA PDF success rate
- Report completeness
- Latency
- Cost and quota usage

Human evaluation rubric:

| Score | Meaning |
| --- | --- |
| 5 | Directly relevant and immediately useful for the research topic. |
| 4 | Highly relevant with minor scope differences. |
| 3 | Indirectly relevant. |
| 2 | Only keyword-level relevance. |
| 1 | Irrelevant or invalid recommendation. |

## Security And Policy Constraints

- Do not bypass paywalls.
- Store only OA PDFs confirmed by Unpaywall or user-provided files.
- Keep credentials in Cloudflare secrets, never in Git.
- Use minimum-scope MCP/tool permissions.
- Do not expose destructive tools such as database drop, account management, or unrestricted file deletion.
- Treat journal metrics as evidence, not as the only quality signal.

## Current Blocker

`wos-starter` subscription approval is pending. Until approval is complete, do not treat live search failures as workflow defects.

After approval:

```text
1. Add WOS_API_KEY to Worker secrets.
2. Confirm /api/diagnostics shows wosApiKey: true.
3. Run a fresh search.
4. Confirm D1 paper/evaluation rows.
5. Confirm R2 reports/<job_id>/papers.csv and report.md.
```

## Next Implementation Priorities Excluding WoS

1. Add failed/completed filters to Recent Jobs.
2. Add report sections for summary, comparison, research gap, and critic note.
3. Add PDF/XLSX output generation to R2.
4. Add read-only MCP tools following `docs/mcp.md`.
5. Add Vectorize-backed relevance scoring.
6. Add Google Drive OA PDF upload for Unpaywall-confirmed PDFs.
7. Add benchmark fixtures and automated tests for CSV, Markdown, D1 mapping, scoring, and diagnostics.

Completed WoS-excluded hardening:

- Final ranking formula now uses persisted score components.
