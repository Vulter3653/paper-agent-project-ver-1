# Final Presentation Outline

Updated: 2026-05-28 (codex)

Target duration: 8 minutes plus Q&A.

## Slide 1 - Title And Claim

Title: Paper Agent: Traceable Multi-Agent Literature Review Automation

Key message: The project turns a research keyword into verified, ranked, downloadable top-journal literature review evidence.

## Slide 2 - Problem

- Literature review requires search, filtering, DOI verification, OA checking, ranking, and report writing across disconnected tools.
- A single LLM response can hide hallucination, metadata mismatch, and weak evidence.
- Target user: business-school student or researcher preparing an early literature review.

## Slide 3 - Agent Architecture

Show the 12-stage workflow:

Planner -> Journal Selector -> Search/Retriever -> Verifier -> Open Access -> Storage -> Evaluation -> Relevance -> Ranking -> Critic -> Report -> Dashboard Delivery.

Explain that each stage is logged and inspectable.

## Slide 4 - System Architecture

Show:

- Cloudflare Pages dashboard
- Cloudflare Worker backend
- D1 database
- R2 output bucket
- Read-only MCP Worker
- WoS, OpenAlex, Crossref, Unpaywall

## Slide 5 - Live Demo Path

Demo sequence:

1. Open Research dashboard.
2. Run a small keyword search.
3. Show ranked papers and paper detail.
4. Show 12-stage trace.
5. Download CSV, Markdown, XLSX, and PDF.
6. Open Ops diagnostics.

Fallback: use the latest completed job if provider quota or network latency affects the live run.

## Slide 6 - Benchmark Design

- 20 task benchmark structure.
- DOI-backed gold labels.
- Rule-based baseline.
- Single-LLM baseline.
- Proposed Multi-Agent results.
- Metrics: Precision@5, NDCG@5, DOI accuracy, paper validity, top-journal precision, hallucination rate, OA success.

## Slide 7 - Current Results

State carefully:

- The deployed prototype completes the search-to-report workflow.
- T001-T003 comparison is reproducible from repository artifacts.
- Full 20-task Proposed Agent runtime evaluation remains future work before broad performance claims.

## Slide 8 - Why Multi-Agent

Map each failure mode to a separate stage:

- Search recall
- Journal filtering
- DOI verification
- OA availability
- Ranking score quality
- Critic review
- Report generation

Key message: traceability is the main advantage over a one-shot LLM.

## Slide 9 - Limitations And Ethics

- External provider quota and availability.
- Metadata and DOI mismatch risk.
- Top-journal bias.
- OA PDF access limitations.
- Ranking is decision support, not final academic authority.

## Slide 10 - Conclusion

Paper Agent is a deployed MVP-plus prototype with:

- Multi-Agent architecture
- RAG/tool-use style scholarly API integration
- MCP read interface
- Reproducible benchmark artifacts
- Live dashboard and downloadable reports

Close with the next work: full benchmark expansion, optional Vectorize/LLM Critic stabilization, and final paper/slide packaging.
