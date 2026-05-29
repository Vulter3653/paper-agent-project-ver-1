# Final Demo Script: Paper Agent

(gemini)

## 1. Introduction: The Traceability Gap (1 minute)
- **Start**: Navigate to the Research Dashboard (`/dashboard/research`).
- **Narration**: "Scholarly research demands more than just keyword matches; it requires a trustworthy chain of evidence. Today, we demonstrate Paper Agent— a modular assistant that turns research keywords into traceable scholarly results."
- **Action**: Enter keywords: `algorithmic management employee trust`.
- **Action**: Click **Run**.
- **Narration**: "While a generic AI might simply list titles, Paper Agent begins a 12-stage execution pipeline, visible here in our progress tracker."

## 2. White-box Evidence & Agent Board (2 minutes)
- **Start**: Navigate to the Ops Dashboard (`/dashboard/ops`).
- **Narration**: "The core of our system is transparency. In the Agent Status Board, you can see each specialized module—from the Planner to the Verifier—performing its specific role."
- **Action**: Highlight the **Verifier Agent** and **Journal Selector** traces.
- **Narration**: "This is our 'White-box' evidence. Unlike a black-box LLM, we record every API intent and decision in Cloudflare D1. If a paper is excluded, the researcher can see exactly why (e.g., failed FT50 journal check)."

## 3. Auditable Ranking & Score Breakdown (2 minutes)
- **Start**: Return to `/dashboard/research`.
- **Action**: Select a top-ranked paper from the table.
- **Narration**: "Once the pipeline completes, we present papers that have passed our quality gate. We don't just provide a list; we provide an auditable Score Breakdown."
- **Action**: Point to the score bars (Relevance, Journal Fit, DOI Integrity).
- **Narration**: "Every score is grounded in verified metadata from Crossref and Web of Science. We also surface Open Access status via Unpaywall, ensuring the researcher has a legal path to the full text."

## 4. Benchmark: Trust over Popularity (2 minutes)
- **Start**: Navigate to the Evaluation Dashboard (`/dashboard/evaluation`).
- **Narration**: "We evaluate our rigor using 'Paper-Agent-Bench'. Here we compare our Multi-Agent approach against Rule-based and Single-LLM baselines."
- **Action**: Show the comparison table for T001-T003.
- **Narration**: "While naive AI might show high popularity-based relevance, Paper Agent ensures 100% Top-Journal Precision and DOI integrity. Our goal isn't just more results, but more *trustworthy* results."

## 5. Synthesis & Deliverables (1 minute)
- **Action**: Click the **Download PDF Report** button.
- **Narration**: "Finally, we synthesize the findings into narrative reports. These artifacts—stored in Cloudflare R2—provide a high-level summary of findings and research gaps, ready for final human review."
- **Action**: (Optional/Fallback) "If a live search hits a quota limit, we can instantly reload a completed job from our Recent Jobs history to ensure a smooth research flow."
- **End**: "Paper Agent closes the traceability gap, providing the accountability academic work requires."

---
**Status**: Script Refined. (gemini)
