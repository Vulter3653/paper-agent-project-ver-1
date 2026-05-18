# Metric Change Report — Proposed Agent Re-evaluation

**Branch**: `benchmark/shonshinemin-metric-qa`
**Reviewer**: shonshinemin
**Date**: 2026-05-18
**Script**: `npm run benchmark:evaluate-proposed` (`benchmark/scripts/evaluate-proposed-agent.mjs`)

---

## What triggered this re-run

The `benchmark/gold_relevant_papers.verified.csv` was updated to include one new promoted entry (G061) derived from the manual review of proposed agent outputs recorded in `benchmark/manual_review_proposed.csv`.

**Gold change**: Added G061 for T003
- Title: "Frontiers: Generative AI and Personalized Video Advertisements"
- DOI: `10.1287/mksc.2023.0494`
- Journal: MARKETING SCIENCE (국제 S급)
- human_relevance: 5
- doi_label_status: **verified** (DOI confirmed; title + journal match in proposed agent output)
- Promotion reason: manual_review proposed paper T003 rank-1, manual_relevance=5, manual_decision=include

---

## Metric delta: before → after gold update

### Per-task

| task_id | metric | Before | After | Δ |
|---|---|---|---|---|
| T001 | precision_at_k | 0.0000 | 0.0000 | 0 |
| T001 | ndcg_at_k | 0.0000 | 0.0000 | 0 |
| T001 | gold_doi_hit_rate_at_k | 0.0000 | 0.0000 | 0 |
| T002 | precision_at_k | 0.0000 | 0.0000 | 0 |
| T002 | ndcg_at_k | 0.0000 | 0.0000 | 0 |
| T002 | gold_doi_hit_rate_at_k | 0.0000 | 0.0000 | 0 |
| **T003** | **precision_at_k** | **0.0000** | **0.2000** | **+0.2000** |
| **T003** | **ndcg_at_k** | **0.0000** | **0.4804** | **+0.4804** |
| **T003** | **gold_doi_hit_rate_at_k** | **0.0000** | **1.0000** | **+1.0000** |
| ALL | gold_count (T003) | 3 | 4 | +1 |
| ALL | verified_gold_count (T003) | 0 | 1 | +1 |

All other metrics (doi_accuracy, paper_validity, top_journal_precision, hallucination, oa_success) are unchanged: all stable at their pre-update values.

### Macro averages (3 tasks)

| Metric | Before | After | Δ |
|---|---|---|---|
| precision_at_k | 0.0000 | **0.0667** | **+0.0667** |
| ndcg_at_k | 0.0000 | **0.1601** | **+0.1601** |
| gold_doi_hit_rate_at_k | 0.0000 | **0.3333** | **+0.3333** |
| doi_accuracy_at_k | 1.0000 | 1.0000 | 0 |
| paper_validity_rate_at_k | 1.0000 | 1.0000 | 0 |
| top_journal_precision_at_k | 1.0000 | 1.0000 | 0 |
| hallucination_rate_at_k | 0.0000 | 0.0000 | 0 |
| oa_success_rate_at_k | 0.0000 | 0.0000 | 0 |

---

## Explanation of changes

### Why only T003 changed

The evaluation script matches proposed agent papers against gold rows where `human_relevance >= 4` AND `doi_label_status = "verified"`. Before this re-run, only one verified gold DOI existed across T001–T003 (T001/G002: `10.1037/e503172020-001`), and that DOI was not returned by the proposed agent for T001. This meant precision@k = 0 for all three tasks.

After the manual review, the T003 rank-1 paper (`10.1287/mksc.2023.0494`, "Frontiers: Generative AI and Personalized Video Advertisements", MARKETING SCIENCE) was confirmed as `human_relevance = 5` and added to the gold set as G061 with `doi_label_status = verified`. Since this DOI appears at rank 1 in the T003 proposed agent results, the evaluation script finds an exact DOI match.

### T003 precision_at_k: 0.0000 → 0.2000

The script computes `precision_at_k = matchedGold.size / min(result_count, k) = 1/5 = 0.2000`. Only 1 of 5 returned papers for T003 matches a verified gold label. The remaining 4 were rated manual_relevance ≤ 3 ("review" or "exclude"): ranks 2–5 were adjacent topic papers (AI in customer care, AI as a research tool, AI companions, consumer AI perception) that are in top marketing journals but do not directly measure advertising effectiveness.

### T003 ndcg_at_k: 0.0000 → 0.4804

The match occurs at rank 1 with relevance gain = 5. DCG = (2^5−1)/log₂(2) = 31.0000. The ideal ordering for T003 has 4 relevant gold papers (G007=5, G061=5, G008=4, G009=4), giving IDCG ≈ 64.53. NDCG = 31/64.53 = 0.4804. The relatively high NDCG despite low precision reflects that the single match is at the top rank with maximum relevance gain — the agent ranked the most relevant paper first.

### T003 gold_doi_hit_rate_at_k: 0.0000 → 1.0000

This metric measures how many of the *verified-DOI gold papers* were found in the top-k results. After adding G061 (the only verified gold paper for T003), and since the agent returned that exact DOI at rank 1, the hit rate is 1/1 = 1.0000.

### Why T001 and T002 did not change

**T001**: All 5 returned papers were reviewed as `manual_relevance ≤ 3`. No paper meets the gold promotion threshold of ≥ 4. The existing verified gold for T001 (G002, DOI `10.1037/e503172020-001`) does not match any returned paper. No change.

**T002**: All 5 returned papers rated manual_relevance ≤ 2. The retrieval was fundamentally off-topic — the agent returned strategic management papers on AI as a firm-level resource (SMJ, AMR, AMJ) rather than papers on applicant reactions to AI in recruitment. No gold promotion possible. T002 has no verified gold, so precision, ndcg, and hit rate remain 0.

### Stable metrics explained

- **doi_accuracy_at_k = 1.0000**: All 15 papers have DOIs and `verification_status = "verified"` from the Crossref check. Independent of gold labels.
- **paper_validity_rate_at_k = 1.0000**: All 15 papers pass the composite validity test (DOI + verified + "title match" in reason + "journal match" in reason). Independent of gold labels.
- **top_journal_precision_at_k = 1.0000**: All 15 papers are in `국제 S급` or `국제 A1급` journals. The journal allowlist filter is working correctly.
- **hallucination_rate_at_k = 0.0000**: Complement of paper_validity_rate; no hallucinated papers detected.
- **oa_success_rate_at_k = 0.0000**: All 15 papers have `unpaywall_status = "failed"` with no OA PDF/landing page URL. The Unpaywall lookup failed for all DOIs (likely a Cloudflare Worker email-normalization issue noted in the deployment log). This is a pipeline bug, not a retrieval quality issue.

---

## Manual review summary (all 15 papers)

| task_id | rank | manual_relevance | manual_decision | failure_type |
|---|---|---|---|---|
| T001 | 1 | 3 | review | relevance_mismatch |
| T001 | 2 | 2 | exclude | relevance_mismatch |
| T001 | 3 | 1 | exclude | relevance_mismatch |
| T001 | 4 | 3 | review | relevance_mismatch |
| T001 | 5 | 2 | exclude | relevance_mismatch |
| T002 | 1 | 1 | exclude | relevance_mismatch |
| T002 | 2 | 2 | exclude | relevance_mismatch |
| T002 | 3 | 1 | exclude | relevance_mismatch |
| T002 | 4 | 1 | exclude | relevance_mismatch |
| T002 | 5 | 1 | exclude | relevance_mismatch |
| **T003** | **1** | **5** | **include** | — |
| T003 | 2 | 3 | review | relevance_mismatch |
| T003 | 3 | 2 | exclude | relevance_mismatch |
| T003 | 4 | 2 | exclude | relevance_mismatch |
| T003 | 5 | 3 | review | relevance_mismatch |

**Gold promotions**: 1 paper (T003 rank-1 → G061)

---

## QA observations and recommendations

| Priority | Observation | Recommendation |
|---|---|---|
| Critical | T002 all 5 results irrelevant (relevance 1–2) | The keyword "artificial intelligence recruitment applicant reaction" is too abstract; the agent returns AI-and-management theory papers instead of empirical applicant reaction studies. Retune keyword decomposition or add explicit applicant/reaction sub-query. |
| High | T003 only 1 of 5 papers relevant | The agent correctly ranks the best paper first (NDCG benefit), but ranks 2–5 are adjacent-topic papers in the same journals. The journal-aware filter passes them because top marketing journals cover broad AI topics. Consider adding a secondary abstract relevance gate. |
| Medium | oa_success_rate = 0 for all tasks | Unpaywall `failed` status for all 15 DOIs. This is the Worker Unpaywall email-normalization bug documented in `docs/progress.md` item 37. Fix the Unpaywall request before next benchmark run. |
| Low | T001 gold is thin — only 1 verified DOI, and it is not in the proposed agent's results | Refine T001 gold with DOI-verified applicant-reaction papers from top HR/org journals (JAP, PPsych, AMJ) to enable meaningful precision measurement. |
