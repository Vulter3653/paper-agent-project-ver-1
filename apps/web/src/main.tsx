import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FileText, Play, RefreshCw, Search } from "lucide-react";
import type { PaperSummary, SearchJob } from "@paper-agent/shared";
import "./styles.css";

type JobResponse = {
  job: SearchJob;
  papers: PaperSummary[];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://paper-agent-project.shch3653.workers.dev").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

const demoPapers: PaperSummary[] = [
  {
    id: "demo-1",
    rank: 1,
    title: "Automated Scholarly Paper Discovery with Agentic Workflows",
    authors: "Kim, Lee, Park",
    year: 2025,
    journalName: "Information Systems Research",
    doi: "10.0000/demo.1",
    oaStatus: "unknown",
    abstractScore: 0.91,
    finalScore: 0.88,
    includeStatus: "include",
    relevanceReason: "Keyword, abstract, and method terms are directly aligned."
  },
  {
    id: "demo-2",
    rank: 2,
    title: "Large Language Models for Literature Review Automation",
    authors: "Choi, Han",
    year: 2024,
    journalName: "Information Systems Review",
    doi: "10.0000/demo.2",
    oaStatus: "oa",
    abstractScore: 0.86,
    finalScore: 0.82,
    includeStatus: "include",
    relevanceReason: "The paper covers literature review automation and evaluation.",
    oaPdfUrl: "https://example.com/demo-paper.pdf",
    oaLicense: "cc-by",
    oaHostType: "repository",
    unpaywallStatus: "found",
    unpaywallReason: "Demo OA location includes PDF URL"
  }
];

function App() {
  const [keyword, setKeyword] = useState("AI interview employer branding");
  const [job, setJob] = useState<SearchJob | null>(null);
  const [papers, setPapers] = useState<PaperSummary[]>(demoPapers);
  const [selectedId, setSelectedId] = useState<string>(demoPapers[0].id);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const selected = useMemo(() => papers.find((paper) => paper.id === selectedId) ?? papers[0], [papers, selectedId]);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(apiUrl(`/api/search-jobs/${job.id}`));
      if (!response.ok) return;
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [job]);

  async function refreshJob() {
    if (!job) return;
    setRefreshing(true);
    setErrorMessage("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${job.id}`));
      if (!response.ok) throw new Error(await readApiError(response, "Failed to refresh search job"));
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
      setSelectedId((current) => (data.papers.some((paper) => paper.id === current) ? current : data.papers[0]?.id ?? ""));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to refresh search job");
    } finally {
      setRefreshing(false);
    }
  }

  async function startSearch() {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(apiUrl("/api/search-jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, yearStart: 2020, maxResults: 20 })
      });
      if (!response.ok) throw new Error(await readApiError(response, "Failed to create search job"));
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
      setSelectedId(data.papers[0]?.id ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create search job");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!job) return;
    window.location.href = apiUrl(`/api/search-jobs/${job.id}/papers.csv`);
  }

  return (
    <main className="shell">
      <section className="toolbar">
        <div>
          <h1>Paper Agent Dashboard</h1>
          <p>Search jobs, ranked papers, relevance reasons, and report links.</p>
        </div>
        <div className="searchBox">
          <Search size={18} />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} aria-label="Research keyword" />
          <button onClick={startSearch} disabled={loading}>
            {loading ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
            Run
          </button>
        </div>
      </section>

      <section className="statusBand">
        <Metric label="Status" value={job?.status ?? "demo"} />
        <Metric label="Step" value={job?.currentStep ?? "ranking preview"} />
        <Metric label="Papers" value={String(papers.length)} />
        <Metric label="Top Score" value={papers[0] ? papers[0].finalScore.toFixed(2) : "-"} />
      </section>
      {errorMessage ? <p className="errorMessage">{errorMessage}</p> : null}

      <section className="contentGrid">
        <div className="tablePanel">
          <div className="panelTitle">
            <h2>Ranked Papers</h2>
            <div className="panelActions">
              <button className="iconButton" onClick={downloadCsv} disabled={!job} aria-label="Download CSV">
                <Download size={18} />
              </button>
              <button className="iconButton" onClick={refreshJob} disabled={!job || refreshing} aria-label="Refresh job">
                <RefreshCw size={18} className={refreshing ? "spin" : undefined} />
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Title</th>
                <th>Year</th>
                <th>OA</th>
                <th>PDF</th>
                <th>Abstract</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {papers.length ? (
                papers.map((paper) => (
                  <tr key={paper.id} className={paper.id === selected?.id ? "selected" : ""} onClick={() => setSelectedId(paper.id)}>
                    <td>{paper.rank}</td>
                    <td>{paper.title}</td>
                    <td>{paper.year}</td>
                    <td>{paper.oaStatus}</td>
                    <td>{paper.oaPdfUrl ? "yes" : paper.oaLandingPageUrl ? "page" : "-"}</td>
                    <td>{paper.abstractScore.toFixed(2)}</td>
                    <td>{paper.finalScore.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="emptyCell">
                    No allowed journal results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="detailPanel">
          <div className="panelTitle">
            <h2>Paper Detail</h2>
            <FileText size={18} />
          </div>
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <dl>
                <dt>Authors</dt>
                <dd>{selected.authors}</dd>
                <dt>Journal</dt>
                <dd>{selected.journalName}</dd>
                <dt>DOI</dt>
                <dd>{selected.doi}</dd>
                <dt>Verification</dt>
                <dd>{selected.verificationStatus ?? "unverified"} · {selected.verificationReason ?? "No verification recorded."}</dd>
                <dt>Open Access</dt>
                <dd>{selected.unpaywallStatus ?? "skipped"} · {selected.unpaywallReason ?? "No Unpaywall lookup recorded."}</dd>
                <dt>PDF</dt>
                <dd>
                  {selected.oaPdfUrl ? (
                    <a href={selected.oaPdfUrl} target="_blank" rel="noreferrer">
                      Open PDF
                    </a>
                  ) : selected.oaLandingPageUrl ? (
                    <a href={selected.oaLandingPageUrl} target="_blank" rel="noreferrer">
                      Open OA page
                    </a>
                  ) : (
                    "No OA URL found"
                  )}
                </dd>
                <dt>License</dt>
                <dd>{[selected.oaLicense, selected.oaHostType, selected.oaRepository].filter(Boolean).join(" · ") || "Unknown"}</dd>
                <dt>Relevance</dt>
                <dd>{selected.relevanceReason}</dd>
              </dl>
            </>
          ) : (
            <p className="emptyState">No allowed journal result selected.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

createRoot(document.getElementById("root")!).render(<App />);
