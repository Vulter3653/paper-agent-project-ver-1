---
discipline: AI Agent 기반 도메인 문제 해결 프로젝트
type: lecture
module: "Final Team Project"
lesson: "Paper Agent: Traceable Multi-Agent Literature Review Automation"
---

## [plan] 발표 구성

- 문제 정의와 사용자
- Multi-Agent 아키텍처
- Cloudflare 기반 시스템 구현
- Live demo 경로
- Benchmark와 baseline 비교
- 한계와 윤리
- 최종 결론

## [divider] 1. Problem

## [content] Literature Review Bottleneck

Business-school literature review는 여러 작업이 분리되어 있어 시간이 많이 소요됩니다.

- Search: WoS / OpenAlex 후보 검색
- Filter: Top Journal Pool 기준 필터링
- Verify: DOI / Crossref metadata 확인
- Access: Unpaywall OA PDF 상태 확인
- Rank: relevance, journal quality, recency, citation 기반 정렬
- Report: CSV / Markdown / XLSX / PDF 산출물 생성

단일 LLM 호출은 중간 오류와 hallucination을 숨길 수 있습니다.

## [divider] 2. Agent Architecture

## [content] 12-Step Literature Review Workflow

| Step | Agent | Status |
| --- | --- | --- |
| 1 | Planner Agent | Implemented |
| 2 | Journal Selector Agent | Implemented |
| 3 | Search/Retriever Agent | Implemented |
| 4 | Verifier Agent | Implemented |
| 5 | Open Access Agent | Implemented |
| 6 | Storage Worker | Implemented |
| 7 | Evaluation Agent | Implemented |
| 8 | Relevance Agent | Partial / opt-in semantic path |
| 9 | Ranking Agent | Implemented |
| 10 | Critic Agent | Rule-based default / LLM opt-in |
| 11 | Report Agent | Implemented |
| 12 | Dashboard Delivery | Implemented |

## [content] Why Multi-Agent?

각 단계는 서로 다른 실패 모드를 가집니다.

- Search recall failure
- Journal allowlist mismatch
- DOI metadata mismatch
- OA PDF unavailable
- Ranking score bias
- Critic review incompleteness

분리된 agent trace는 오류 위치를 확인하고 재현성을 높입니다.

## [divider] 3. System Implementation

## [content] Cloudflare Deployment

| Component | Role |
| --- | --- |
| Cloudflare Pages | Dashboard UI |
| Cloudflare Worker | Backend API and search workflow |
| Cloudflare D1 | Jobs, papers, evaluations, traces |
| Cloudflare R2 | Report artifacts |
| Remote MCP Worker | Read-only inspection tools |

External tools:

- Web of Science
- OpenAlex fallback
- Crossref
- Unpaywall
- Google Drive conditional path

## [content] Dashboard Routes

- /dashboard/research: run search, ranked papers, paper detail, report preview
- /dashboard/ops: diagnostics, provider readiness, D1/R2 state
- /dashboard/evaluation: baseline comparison and implementation status

## [divider] 4. Demo

## [content] Live Demo Sequence

1. Open Research dashboard
2. Run a conservative keyword search
3. Check 12-stage trace
4. Inspect Ranked Papers and Paper Detail
5. Download CSV / Markdown / XLSX / PDF
6. Open Ops diagnostics
7. Open Evaluation benchmark snapshot

Fallback:

- Use latest completed job ID if provider quota or network latency occurs.

## [divider] 5. Benchmark

## [content] Evaluation Design

Benchmark assets are repository-controlled.

- 20 task structure
- DOI-backed gold labels
- Rule-based baseline
- Single-LLM baseline
- Proposed Multi-Agent results
- Reproducible scripts and CSV/JSON outputs

Metrics:

- Precision@5
- NDCG@5
- DOI Accuracy
- Paper Validity
- Top Journal Precision
- Hallucination Rate
- OA Success

## [content] Claim Boundary

Current safe claim:

- The deployed prototype completes the search-to-report workflow.
- T001-T003 comparison is reproducible from repository artifacts.
- Full 20-task Proposed Agent runtime evaluation remains future work.

Do not claim universal outperformance until the full benchmark supports it.

## [divider] 6. Limitations And Ethics

## [content] Known Limitations

- External provider quota and availability
- Metadata or DOI mismatch
- Top-journal bias
- OA PDF access limitations
- Optional Vectorize and LLM Critic paths need additional validation
- Ranking is decision support, not academic authority

## [divider] 7. Conclusion

## [content] Final Positioning

Paper Agent is a deployed MVP-plus prototype that demonstrates:

- Multi-Agent workflow
- RAG / Tool Use with scholarly APIs
- MCP-based read inspection
- Cloudflare deployment
- Reproducible benchmark artifacts
- Live dashboard and downloadable reports

Next work:

- Full 20-task runtime benchmark
- Polished final paper and PPTX
- Optional semantic and LLM critic stabilization
