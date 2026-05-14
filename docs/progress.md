# Project Progress And Session Handoff

Updated: 2026-05-14

## Mandatory Session Handoff Rules

This file is the required handoff document for future sessions. Before ending any work session, update this file in the same commit or final repository state.

Strict rules:

- Always update `Updated:` to the current date.
- Record all meaningful work completed during the session.
- Record verification commands and whether they passed, failed, or were not run.
- Record deployment URLs, database IDs, branch names, and service names when they change.
- Record any uncommitted work, local-only state, blockers, and manual Cloudflare/GitHub actions still required.
- Keep `Next Session Start Here` accurate and specific enough that a new session can continue without re-reading the full conversation.
- Update `CHANGELOG.md` whenever `docs/progress.md` changes.
- Do not remove historical context unless it is replaced with more accurate current state.

## Next Session Start Here

Start from the current `main` branch. First check:

```bash
git status --short --branch
git log --oneline -8
```

Then verify deployed behavior:

```text
Dashboard: https://paper-agent-project.pages.dev/
Worker health: https://paper-agent-project.shch3653.workers.dev/api/health
```

Current next implementation target:

1. Wait for Cloudflare to deploy the next `main` commit.
2. Click `Run` on the dashboard and confirm search output contains only journals in `packages/shared/src/businessSchoolJournals.ts`.
3. Confirm non-allowlisted journals are absent from API, dashboard, CSV, and D1 `papers` rows.
4. Verify deployed CSV download still includes Crossref and Unpaywall columns.
5. Start the next major implementation phase: scoring/evaluation improvements or report generation.

## Current Status

The project is deployed through the cloud workflow:

1. Code changes are committed and pushed to `origin/main`.
2. Cloudflare picks up GitHub changes and deploys the Worker and Pages projects.
3. The dashboard calls the deployed Worker API.
4. The Worker searches OpenAlex and writes search job results to Cloudflare D1.
5. D1 Console queries now return stored rows.

The latest confirmed behavior is normal:

- Clicking `Run` in the dashboard creates a search job.
- `POST /api/search-jobs` now calls the OpenAlex Works API, maps returned works, scores them, and stores the result in D1.
- `search_jobs`, `papers`, and `evaluations` receive rows in D1.
- D1 Console no longer returns empty results after a successful run.

## Repository And Deployment Targets

- GitHub repository: `https://github.com/Vulter3653/paper-agent-project.git`
- Active branch: `main`
- Worker service: `paper-agent-project`
- Dashboard Pages project: `paper-agent-dashboard`
- D1 database: `paper_agent_db`
- D1 binding: `DB`
- D1 database ID: `4d622431-3574-4e04-a359-dada93e97438`
- Default Worker API URL: `https://paper-agent-project.shch3653.workers.dev`
- Dashboard URL: `https://paper-agent-project.pages.dev/`

Local manual Cloudflare deployment is not used. Deployment should happen in Cloudflare from GitHub commits.

## Implemented

### Monorepo

- Root npm workspace configuration.
- `apps/web` for the React/Vite dashboard.
- `apps/worker` for the Cloudflare Worker API.
- `packages/shared` for shared TypeScript types and scoring helpers.
- `docs` and `benchmark` directories for project references.

### Dashboard

- Search keyword input.
- `Run` button calls `POST /api/search-jobs`.
- Ranked papers table.
- Selected paper detail panel.
- Status metrics for job state, step, paper count, and top score.
- Refresh button calls `GET /api/search-jobs/:id`.
- API error messages are shown in the page when search creation or refresh fails.
- Dashboard API base URL supports `VITE_API_BASE_URL`, with a deployed Worker default.

### Worker API

- `GET /api/health`
- `POST /api/search-jobs`
- `GET /api/search-jobs/:id`
- `GET /api/search-jobs/:id/papers.csv`
- CORS headers for dashboard access.
- D1 binding validation.
- D1 schema creation/backfill checks.
- OpenAlex Works API search using the dashboard keyword.
- OpenAlex API key support through `OPENALEX_API_KEY`.
- OpenAlex retry/backoff handling for 429 and 5xx responses.
- OpenAlex result mapping for title, authors, year, journal/source, DOI, OA status, abstract, OpenAlex ID, and citation count.
- Basic relevance scoring based on title keyword overlap, abstract keyword overlap, citation count, and recency.
- Search job persistence into D1.
- D1 readback for job, paper, and evaluation data.
- Direct CSV generation from persisted D1 results while R2 is unavailable.
- Crossref DOI lookup after OpenAlex search.
- Crossref metadata enrichment for publisher, ISSN, publication type, and published date.
- Basic DOI/title/year/journal verification status and reason fields.
- Unpaywall DOI lookup after Crossref enrichment.
- Unpaywall open access metadata persistence for PDF URL, landing page URL, license, host type, repository, status, and reason.
- Business school journal allowlist filtering based on `경영대학 학술지 목록.docx`; non-allowlisted journals are removed before D1 persistence and API/CSV output.
- JSON error responses for API failures.

### D1 Schema

Schema is tracked in `apps/worker/schema.sql`.

Tables:

- `search_jobs`
- `papers`
- `evaluations`

Additional paper metadata now tracked/backfilled:

- `openalex_id`
- `abstract`
- `cited_by_count`
- `crossref_id`
- `publisher`
- `issn`
- `publication_type`
- `published_date`
- `verification_status`
- `verification_reason`
- `oa_pdf_url`
- `oa_landing_page_url`
- `oa_license`
- `oa_host_type`
- `oa_repository`
- `unpaywall_status`
- `unpaywall_reason`

Indexes:

- `idx_papers_job_id`
- `idx_evaluations_paper_id`

The deployed D1 database already had some existing schema constraints, including `papers.created_at NOT NULL`. The Worker now inserts `created_at` values for papers and evaluations.

### Change Tracking

- `CHANGELOG.md` was added and is used as the required manual change log.
- `.github/pull_request_template.md` was added to enforce changelog updates.

## Important Fixes Completed

- Worker name aligned to the existing Cloudflare service: `paper-agent-project`.
- Root `wrangler.toml` added for Cloudflare root deploy compatibility.
- D1 binding configured without R2, because R2 is intentionally disabled for the MVP.
- Workspace build scripts added so root `npm run build` succeeds.
- Dashboard connected to the deployed Worker API.
- Worker POST route fixed after Cloudflare error 1101 by returning JSON errors and handling D1 schema drift.
- D1 insert fixed for `papers.created_at NOT NULL`.
- Demo-only persistence was replaced with OpenAlex search and D1 persistence.
- OpenAlex 429 errors now return a clearer message asking for `OPENALEX_API_KEY` and `OPENALEX_EMAIL`.
- CSV export endpoint and dashboard CSV button were added and locally verified.
- Crossref enrichment was added after OpenAlex mapping so DOI-backed results carry publisher, ISSN, publication type, published date, and verification reasons.
- Unpaywall enrichment was added after Crossref mapping so DOI-backed results carry OA PDF/page metadata without requiring R2 storage.
- Journal allowlist filtering was added so only journals from `packages/shared/src/businessSchoolJournals.ts` appear in search results.

## Verification Completed

These commands passed after recent code changes:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

CSV endpoint was also locally verified with `wrangler dev`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`.

Crossref enrichment was locally verified with `wrangler dev`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`. The local JSON and CSV responses included `publisher`, `issn`, `publication_type`, `published_date`, `verification_status`, and `verification_reason`.

Unpaywall enrichment was locally verified with `wrangler dev --var UNPAYWALL_EMAIL:...`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`. The local JSON and CSV responses included `oa_pdf_url`, `oa_landing_page_url`, `oa_license`, `oa_host_type`, `oa_repository`, `unpaywall_status`, and `unpaywall_reason`.

Business school journal allowlist filtering was locally verified with `wrangler dev`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`. The local JSON and CSV responses contained only allowlisted journals, including `Journal of the Academy of Marketing Science` and `Journal of Business Ethics`, and excluded the previously observed non-allowlisted `International Journal of Information Management` result.

## Manual Cloudflare Settings Required

For real OpenAlex search, configure these on the Worker service:

```text
Workers & Pages
-> paper-agent-project
-> Settings
-> Variables and Secrets
```

Add:

```text
OPENALEX_EMAIL=<contact email>
OPENALEX_API_KEY=<OpenAlex API key>
CROSSREF_EMAIL=<contact email>
UNPAYWALL_EMAIL=<contact email>
```

OpenAlex API key can be created from:

```text
https://openalex.org/settings/api
```

Cloud behavior was also verified:

```sql
SELECT * FROM search_jobs;
SELECT * FROM papers;
SELECT * FROM evaluations;
```

After clicking `Run`, these queries returned stored data.

## Remaining Work

OpenAlex search, D1 persistence, CSV export, Crossref enrichment, Unpaywall metadata lookup, and business school journal allowlist filtering are implemented locally. After Cloudflare deploys the next commit, verify the deployed dashboard and D1 rows. The next major implementation phase is hardening and extending real paper discovery:

1. Confirm deployed allowlist filtering from the dashboard, CSV endpoint, and D1 Console.
2. Improve scoring and evaluation rows beyond basic lexical scoring.
3. Add report generation.
4. Add job progress states instead of immediately marking jobs as `completed`.
5. Add tests around Worker API persistence, OpenAlex mapping, journal allowlist filtering, Crossref enrichment, Unpaywall enrichment, CSV generation, and D1 row mapping.

## Useful D1 Checks

After a dashboard run:

```sql
SELECT * FROM search_jobs ORDER BY created_at DESC;
SELECT * FROM papers ORDER BY created_at DESC;
SELECT * FROM evaluations ORDER BY created_at DESC;
```

Count rows:

```sql
SELECT COUNT(*) FROM search_jobs;
SELECT COUNT(*) FROM papers;
SELECT COUNT(*) FROM evaluations;
```

OpenAlex metadata check:

```sql
SELECT title, openalex_id, cited_by_count, substr(abstract, 1, 120) AS abstract_preview
FROM papers
ORDER BY created_at DESC
LIMIT 10;
```

Crossref metadata check:

```sql
SELECT title, doi, publisher, issn, publication_type, published_date, verification_status, verification_reason
FROM papers
ORDER BY created_at DESC
LIMIT 10;
```

If this query returns `no such column: publisher`, first run:

```sql
PRAGMA table_info(papers);
```

Then add only the missing Crossref columns from:

```text
apps/worker/migrations/0002_add_crossref_columns.sql
```

Unpaywall metadata check:

```sql
SELECT title, doi, oa_pdf_url, oa_landing_page_url, oa_license, oa_host_type, oa_repository, unpaywall_status, unpaywall_reason
FROM papers
ORDER BY created_at DESC
LIMIT 10;
```

If this query returns `no such column: oa_pdf_url`, first run:

```sql
PRAGMA table_info(papers);
```

Then add only the missing Unpaywall columns from:

```text
apps/worker/migrations/0003_add_unpaywall_columns.sql
```

Business school journal allowlist check:

```sql
SELECT DISTINCT journal_name
FROM papers
ORDER BY journal_name ASC;
```

Every returned `journal_name` should correspond to `packages/shared/src/businessSchoolJournals.ts`.

CSV check:

```text
https://paper-agent-project.shch3653.workers.dev/api/search-jobs/<job_id>/papers.csv
```
