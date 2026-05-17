# Paper-Agent-Bench Summary

Updated: 2026-05-17

## Status

The first benchmark fixture layer is now initialized from `paper_agent_enhanced_report.md`.

Current files:

- `benchmark/tasks.jsonl`: 20 benchmark tasks covering organization/HR, marketing, strategy, accounting/finance, operations, and information systems.
- `benchmark/keywords.csv`: compatibility keyword list expanded from 3 to 20 queries.
- `benchmark/gold_relevant_papers.csv`: 60 seed gold relevance rows, 3 per task.
- `benchmark/gold_relevant_papers.verified.csv`: first Crossref title-query verification pass.
- `benchmark/evaluation_rubric.md`: human scoring, core metrics, and agent-level checks.
- `benchmark/scripts/verify-gold-crossref.mjs`: local Crossref verification utility.

## Important Constraint

The seed gold rows intentionally do not fabricate DOI values. Each DOI field is blank and marked with:

```text
doi_label_status=needs_crossref_verification
```

The first Crossref title-query pass has been run. It produced:

| Status | Count | Meaning |
| --- | ---: | --- |
| `verified` | 6 | Title match exceeded the automatic verification threshold. |
| `ambiguous` | 17 | Crossref returned a possible DOI, but the title match is not strong enough for final gold use. |
| `no_match` | 37 | No acceptable Crossref title candidate was found. |

This confirms that the seed labels are useful as benchmark topics, but not yet strong enough as final DOI gold labels. Before computing final DOI Accuracy, the ambiguous and no-match rows need manual title refinement or replacement with exact known papers.

## Planned Baseline Comparison

The benchmark will compare:

1. Rule-based scholarly search baseline
2. Single LLM recommendation baseline
3. Proposed top-journal-aware multi-agent workflow

Target metrics:

- Precision@5
- NDCG@5
- Paper Validity Rate
- DOI Accuracy
- Top Journal Precision
- Hallucination Rate
- OA PDF Success Rate
- Report Completeness

## Next Step

Refine the gold set:

1. Review `ambiguous` rows and keep only papers from the approved journal universe.
2. Replace `no_match` seed titles with exact paper titles from WoS/Crossref search.
3. Re-run:

```bash
npm run benchmark:verify-gold
```

After enough DOI labels are verified, run the 20 tasks through the deployed Worker and record:

```text
benchmark/proposed_agent_results.csv
benchmark/baseline_results.csv
```
