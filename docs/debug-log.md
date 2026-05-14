# Debug Log

This file records debugging and troubleshooting work that affects implementation, deployment, or verification. Update it whenever a defect is investigated or a verification run changes project confidence.

## 2026-05-14 - Crossref Enrichment And Verifier Foundation

### Context

The next development phase after CSV export was to start the Verifier Agent foundation. The Worker now enriches OpenAlex DOI-backed papers with Crossref metadata and records a basic verification decision.

### Code Changes Under Test

- Added Crossref DOI lookup in `apps/worker/src/index.ts`.
- Added paper fields for Crossref ID, publisher, ISSN, publication type, published date, verification status, and verification reason.
- Added D1 schema creation/backfill checks for the new paper columns.
- Added Crossref and verification columns to CSV output.
- Added shared dashboard/API type fields in `packages/shared/src/index.ts`.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":1}'
```

Observed:

- HTTP 200.
- Response contained OpenAlex-derived paper data.
- Response included Crossref-derived fields: `publisher`, `issn`, `publicationType`, `publishedDate`, `verificationStatus`, and `verificationReason`.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-bc0b798d-8dcd-46e0-8fa2-7131dbf74987/papers.csv
```

Observed:

- HTTP 200.
- CSV header included `publisher`, `issn`, `publication_type`, `published_date`, `verification_status`, and `verification_reason`.
- CSV row included Crossref metadata and verification details.

### Troubleshooting Notes

- The first local JSON check showed Crossref enrichment was being saved but not returned because `mapPaperSummary` did not expose the new optional fields.
- The row mapper was updated to return the Crossref and verification fields.
- Review found that string-based match counting could treat `mismatch` as a successful match because the word ends with `match`; verification now counts boolean match results instead.
- A second local POST confirmed the fields were present in the API response and CSV output.
- The local runtime emitted non-blocking `workerd` RPC messages during dev server execution, but API calls completed successfully.

### Resolution

Crossref enrichment is locally verified. Remaining action: commit, push, wait for Cloudflare deployment, add `CROSSREF_EMAIL` to the Worker variables/secrets, and verify deployed D1 rows.

## 2026-05-13 - CSV Export Endpoint Verification

### Context

The project needed a CSV download path because R2 is unavailable during the MVP due to billing constraints. The intended flow was:

```text
Dashboard Run
-> Worker creates/searches a job
-> D1 persists job, papers, evaluations
-> Dashboard Download button calls GET /api/search-jobs/:id/papers.csv
-> Worker generates CSV directly from D1
```

### Code Changes Under Test

- Added Worker route:

```text
GET /api/search-jobs/:id/papers.csv
```

- Added CSV generation helpers in `apps/worker/src/index.ts`.
- Added dashboard CSV button in `apps/web/src/main.tsx`.
- Added button layout styling in `apps/web/src/styles.css`.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1
```

Create a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":2}'
```

Observed:

- HTTP 200.
- Response contained a completed job.
- Response contained OpenAlex-derived paper results.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-a0b2e7ba-cef1-4c49-a8f4-bf33cd699983/papers.csv | head -n 20
```

Observed:

- HTTP 200.
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition` attachment filename was set.
- CSV header row was present.
- CSV rows included rank, title, authors, DOI, OA status, scores, and relevance reason.

### Troubleshooting Notes

- The previous turn was interrupted after implementation and verification but before documentation and commit.
- No `wrangler dev` process remained running after interruption.
- No code rollback was required.
- The local runtime emitted non-blocking `workerd` RPC messages during dev server execution, but API calls completed successfully with HTTP 200 responses.
- The CSV endpoint depends on an existing job ID. A browser GET to `/api/search-jobs` still returns `{"error":"Not found"}` because that route is intentionally POST-only.

### Resolution

The CSV export implementation is locally verified. Remaining action: commit, push, wait for Cloudflare deployment, and verify the deployed dashboard download button.
