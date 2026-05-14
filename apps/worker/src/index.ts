import { calculateFinalScore, type PaperSummary, type SearchJob } from "@paper-agent/shared";

export interface Env {
  DB?: D1Database;
  REPORTS?: R2Bucket;
  OPENALEX_EMAIL?: string;
  OPENALEX_API_KEY?: string;
  CROSSREF_EMAIL?: string;
  UNPAYWALL_EMAIL?: string;
  GOOGLE_CLIENT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_DRIVE_FOLDER_ID?: string;
}

type CreateSearchJobRequest = {
  keyword?: string;
  yearStart?: number;
  yearEnd?: number;
  maxResults?: number;
};

type PaperRecord = PaperSummary & {
  openalexId: string;
  abstract: string;
  citedByCount: number;
  crossrefId: string;
  publisher: string;
  issn: string;
  publicationType: string;
  publishedDate: string;
  verificationStatus: "verified" | "partial" | "unverified";
  verificationReason: string;
};

type OpenAlexResponse = {
  results?: OpenAlexWork[];
};

type OpenAlexWork = {
  id?: string;
  display_name?: string;
  title?: string;
  publication_year?: number;
  doi?: string | null;
  cited_by_count?: number;
  abstract_inverted_index?: Record<string, number[]> | null;
  authorships?: Array<{
    author?: {
      display_name?: string;
    };
  }>;
  primary_location?: {
    source?: {
      display_name?: string;
    } | null;
  } | null;
  host_venue?: {
    display_name?: string;
  } | null;
  open_access?: {
    is_oa?: boolean;
    oa_status?: string;
  } | null;
};

type CrossrefResponse = {
  message?: CrossrefWork;
};

type CrossrefWork = {
  DOI?: string;
  title?: string[];
  publisher?: string;
  ISSN?: string[];
  type?: string;
  "container-title"?: string[];
  published?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
};

type SearchJobRow = {
  id: string;
  keyword: string;
  status: SearchJob["status"];
  current_step: string;
  total_steps: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type PaperSummaryRow = {
  id: string;
  rank: number;
  title: string;
  authors: string;
  year: number;
  journal_name: string;
  doi: string;
  oa_status: PaperSummary["oaStatus"];
  abstract_score: number | null;
  final_score: number | null;
  include_status: PaperSummary["includeStatus"] | null;
  relevance_reason: string | null;
  publisher: string | null;
  issn: string | null;
  publication_type: string | null;
  published_date: string | null;
  verification_status: PaperRecord["verificationStatus"] | null;
  verification_reason: string | null;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "paper-agent-worker" });
    }

    if (url.pathname === "/api/search-jobs" && request.method === "POST") {
      try {
        const body = await readJson<CreateSearchJobRequest>(request);
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const keyword = normalizeKeyword(body.keyword);
        const maxResults = normalizeMaxResults(body.maxResults);
        const job = createSearchJob(keyword, "searching");
        await saveSearchJob(env.DB, job);
        const papers = await searchOpenAlex(keyword, {
          email: env.OPENALEX_EMAIL,
          apiKey: env.OPENALEX_API_KEY,
          crossrefEmail: env.CROSSREF_EMAIL ?? env.OPENALEX_EMAIL,
          maxResults,
          yearStart: body.yearStart,
          yearEnd: body.yearEnd
        });
        const completedJob = completeSearchJob(job);
        await saveSearchResult(env.DB, completedJob, papers);
        return json((await getSearchResult(env.DB, completedJob.id)) ?? { job: completedJob, papers });
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const jobMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)$/);
    if (jobMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, jobMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return json(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const csvMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/papers\.csv$/);
    if (csvMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, csvMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return csv(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};

async function readJson<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

function normalizeKeyword(keyword: string | undefined): string {
  const normalized = keyword?.trim();
  return normalized || "AI interview employer branding";
}

function normalizeMaxResults(maxResults: number | undefined): number {
  if (typeof maxResults !== "number" || !Number.isFinite(maxResults)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(maxResults)));
}

function createSearchJob(keyword: string, status: SearchJob["status"], id = `job-${crypto.randomUUID()}`): SearchJob {
  const now = new Date().toISOString();
  return {
    id,
    keyword,
    status,
    currentStep: status === "searching" ? "openalex_search" : "ranking",
    totalSteps: 12,
    createdAt: now
  };
}

function completeSearchJob(job: SearchJob): SearchJob {
  return {
    ...job,
    status: "completed",
    currentStep: "ranking",
    completedAt: new Date().toISOString()
  };
}

async function ensureSchema(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS search_jobs (
        id TEXT PRIMARY KEY,
        keyword TEXT NOT NULL,
        status TEXT NOT NULL,
        current_step TEXT NOT NULL,
        total_steps INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        error_message TEXT
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        rank INTEGER NOT NULL,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        year INTEGER NOT NULL,
        journal_name TEXT NOT NULL,
        doi TEXT NOT NULL,
        oa_status TEXT NOT NULL,
        openalex_id TEXT,
        abstract TEXT,
        cited_by_count INTEGER DEFAULT 0,
        crossref_id TEXT,
        publisher TEXT,
        issn TEXT,
        publication_type TEXT,
        published_date TEXT,
        verification_status TEXT,
        verification_reason TEXT,
        FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        abstract_score REAL NOT NULL,
        final_score REAL NOT NULL,
        include_status TEXT NOT NULL,
        relevance_reason TEXT NOT NULL,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      )`
    )
    .run();

  await ensureColumn(db, "search_jobs", "id", "TEXT");
  await ensureColumn(db, "search_jobs", "keyword", "TEXT DEFAULT ''");
  await ensureColumn(db, "search_jobs", "status", "TEXT DEFAULT 'completed'");
  await ensureColumn(db, "search_jobs", "current_step", "TEXT DEFAULT 'ranking'");
  await ensureColumn(db, "search_jobs", "total_steps", "INTEGER DEFAULT 12");
  await ensureColumn(db, "search_jobs", "created_at", "TEXT");
  await ensureColumn(db, "search_jobs", "completed_at", "TEXT");
  await ensureColumn(db, "search_jobs", "error_message", "TEXT");

  await ensureColumn(db, "papers", "id", "TEXT");
  await ensureColumn(db, "papers", "job_id", "TEXT");
  await ensureColumn(db, "papers", "rank", "INTEGER DEFAULT 0");
  await ensureColumn(db, "papers", "title", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "authors", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "year", "INTEGER DEFAULT 0");
  await ensureColumn(db, "papers", "journal_name", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "doi", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "oa_status", "TEXT DEFAULT 'unknown'");
  await ensureColumn(db, "papers", "openalex_id", "TEXT");
  await ensureColumn(db, "papers", "abstract", "TEXT");
  await ensureColumn(db, "papers", "cited_by_count", "INTEGER DEFAULT 0");
  await ensureColumn(db, "papers", "crossref_id", "TEXT");
  await ensureColumn(db, "papers", "publisher", "TEXT");
  await ensureColumn(db, "papers", "issn", "TEXT");
  await ensureColumn(db, "papers", "publication_type", "TEXT");
  await ensureColumn(db, "papers", "published_date", "TEXT");
  await ensureColumn(db, "papers", "verification_status", "TEXT");
  await ensureColumn(db, "papers", "verification_reason", "TEXT");
  await ensureColumn(db, "papers", "created_at", "TEXT");

  await ensureColumn(db, "evaluations", "id", "TEXT");
  await ensureColumn(db, "evaluations", "paper_id", "TEXT");
  await ensureColumn(db, "evaluations", "abstract_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "final_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "include_status", "TEXT DEFAULT 'review'");
  await ensureColumn(db, "evaluations", "relevance_reason", "TEXT DEFAULT ''");
  await ensureColumn(db, "evaluations", "created_at", "TEXT");

  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS idx_papers_job_id ON papers(job_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_evaluations_paper_id ON evaluations(paper_id)")
  ]);
}

async function ensureColumn(db: D1Database, tableName: string, columnName: string, definition: string): Promise<void> {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  if (columns.results.some((column) => column.name === columnName)) return;
  await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

async function saveSearchJob(db: D1Database, job: SearchJob): Promise<void> {
  await db
    .prepare(
      `INSERT INTO search_jobs (id, keyword, status, current_step, total_steps, created_at, completed_at, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(job.id, job.keyword, job.status, job.currentStep, job.totalSteps, job.createdAt, job.completedAt ?? null, job.errorMessage ?? null)
    .run();
}

async function saveSearchResult(db: D1Database, job: SearchJob, papers: PaperRecord[]): Promise<void> {
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE search_jobs
         SET status = ?, current_step = ?, completed_at = ?, error_message = ?
         WHERE id = ?`
      )
      .bind(job.status, job.currentStep, job.completedAt ?? null, job.errorMessage ?? null, job.id)
  ];

  for (const paper of papers) {
    const paperId = `${job.id}-paper-${paper.rank}`;
    statements.push(
      db
        .prepare(
          `INSERT INTO papers (
            id, job_id, rank, title, authors, year, journal_name, doi, oa_status,
            openalex_id, abstract, cited_by_count, crossref_id, publisher, issn,
            publication_type, published_date, verification_status, verification_reason, created_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          paperId,
          job.id,
          paper.rank,
          paper.title,
          paper.authors,
          paper.year,
          paper.journalName,
          paper.doi,
          paper.oaStatus,
          paper.openalexId,
          paper.abstract,
          paper.citedByCount,
          paper.crossrefId,
          paper.publisher,
          paper.issn,
          paper.publicationType,
          paper.publishedDate,
          paper.verificationStatus,
          paper.verificationReason,
          now
        )
    );
    statements.push(
      db
        .prepare(
          `INSERT INTO evaluations (id, paper_id, abstract_score, final_score, include_status, relevance_reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          `${job.id}-evaluation-${paper.rank}`,
          paperId,
          paper.abstractScore,
          paper.finalScore,
          paper.includeStatus,
          paper.relevanceReason,
          now
        )
    );
  }

  await db.batch(statements);
}

async function searchOpenAlex(
  keyword: string,
  options: { email?: string; apiKey?: string; crossrefEmail?: string; maxResults: number; yearStart?: number; yearEnd?: number }
): Promise<PaperRecord[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", keyword);
  url.searchParams.set("per-page", String(options.maxResults));
  url.searchParams.set("sort", "cited_by_count:desc");
  url.searchParams.set(
    "select",
    [
      "id",
      "doi",
      "display_name",
      "title",
      "publication_year",
      "cited_by_count",
      "abstract_inverted_index",
      "authorships",
      "primary_location",
      "open_access"
    ].join(",")
  );
  if (options.apiKey) url.searchParams.set("api_key", options.apiKey);
  if (options.email) url.searchParams.set("mailto", options.email);

  const filters: string[] = [];
  if (options.yearStart) filters.push(`from_publication_date:${Math.trunc(options.yearStart)}-01-01`);
  if (options.yearEnd) filters.push(`to_publication_date:${Math.trunc(options.yearEnd)}-12-31`);
  if (filters.length) url.searchParams.set("filter", filters.join(","));

  const response = await fetchOpenAlexWithRetry(url, options.email);

  const data = (await response.json()) as OpenAlexResponse;
  const papers = (data.results ?? []).slice(0, options.maxResults).map((work, index) => mapOpenAlexWork(work, keyword, index + 1));
  return enrichPapersWithCrossref(papers, options.crossrefEmail);
}

async function fetchOpenAlexWithRetry(url: URL, email: string | undefined): Promise<Response> {
  const maxAttempts = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": email ? `paper-agent-project (${email})` : "paper-agent-project"
      }
    });

    if (response.ok) return response;
    lastResponse = response;

    if (response.status !== 429 && response.status < 500) break;
    await sleep(2 ** attempt * 1000);
  }

  if (lastResponse?.status === 429) {
    const reset = lastResponse.headers.get("X-RateLimit-Reset");
    const remaining = lastResponse.headers.get("X-RateLimit-Remaining");
    const resetText = reset ? ` Reset in ${reset} seconds.` : "";
    const remainingText = remaining ? ` Remaining credits: ${remaining}.` : "";
    throw new Error(
      `OpenAlex rate limit reached (429). Add OPENALEX_API_KEY and OPENALEX_EMAIL in Cloudflare Worker variables/secrets, then redeploy.${remainingText}${resetText}`
    );
  }

  throw new Error(`OpenAlex request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapOpenAlexWork(work: OpenAlexWork, keyword: string, rank: number): PaperRecord {
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const title = work.display_name || work.title || "Untitled work";
  const authors = mapAuthors(work);
  const year = work.publication_year ?? 0;
  const citedByCount = work.cited_by_count ?? 0;
  const scores = scorePaper({ keyword, title, abstract, citedByCount, year });
  return {
    id: work.id || `openalex-${rank}`,
    rank,
    title,
    authors,
    year,
    journalName: work.primary_location?.source?.display_name || work.host_venue?.display_name || "Unknown source",
    doi: normalizeDoi(work.doi),
    oaStatus: mapOaStatus(work.open_access),
    abstractScore: scores.abstractScore,
    finalScore: scores.finalScore,
    includeStatus: scores.finalScore >= 0.35 ? "include" : "review",
    relevanceReason: scores.reason,
    openalexId: work.id ?? "",
    abstract,
    citedByCount,
    crossrefId: "",
    publisher: "",
    issn: "",
    publicationType: "",
    publishedDate: "",
    verificationStatus: normalizeDoi(work.doi) ? "unverified" : "partial",
    verificationReason: normalizeDoi(work.doi) ? "Crossref verification pending." : "No DOI available for Crossref verification."
  };
}

async function enrichPapersWithCrossref(papers: PaperRecord[], email: string | undefined): Promise<PaperRecord[]> {
  const enriched: PaperRecord[] = [];
  for (const paper of papers) {
    if (!paper.doi) {
      enriched.push(paper);
      continue;
    }

    try {
      const crossref = await fetchCrossrefWork(paper.doi, email);
      enriched.push(applyCrossrefMetadata(paper, crossref));
    } catch (error) {
      enriched.push({
        ...paper,
        verificationStatus: "partial",
        verificationReason: `Crossref lookup failed: ${getErrorMessage(error)}`
      });
    }
  }
  return enriched;
}

async function fetchCrossrefWork(doi: string, email: string | undefined): Promise<CrossrefWork> {
  const url = new URL(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (email) url.searchParams.set("mailto", email);
  const response = await fetchCrossrefWithRetry(url, email);
  const data = (await response.json()) as CrossrefResponse;
  if (!data.message) throw new Error("Crossref response did not include message metadata");
  return data.message;
}

async function fetchCrossrefWithRetry(url: URL, email: string | undefined): Promise<Response> {
  const maxAttempts = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": email ? `paper-agent-project (${email})` : "paper-agent-project"
      }
    });
    if (response.ok) return response;
    lastResponse = response;
    if (response.status !== 429 && response.status < 500) break;
    await sleep(2 ** attempt * 1000);
  }

  throw new Error(`Crossref request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function applyCrossrefMetadata(paper: PaperRecord, crossref: CrossrefWork): PaperRecord {
  const crossrefTitle = crossref.title?.[0] ?? "";
  const crossrefJournal = crossref["container-title"]?.[0] ?? "";
  const crossrefYear = getCrossrefYear(crossref);
  const titleMatches = crossrefTitle ? isSimilarText(paper.title, crossrefTitle) : null;
  const yearMatches = crossrefYear ? paper.year === crossrefYear : null;
  const journalMatches = crossrefJournal ? isSimilarText(paper.journalName, crossrefJournal) : null;
  const checks = [
    titleMatches === null ? "title missing" : `title ${titleMatches ? "match" : "mismatch"}`,
    yearMatches === null ? "year missing" : `year ${yearMatches ? "match" : "mismatch"}`,
    journalMatches === null ? "journal missing" : `journal ${journalMatches ? "match" : "mismatch"}`
  ];
  const matchCount = [titleMatches, yearMatches, journalMatches].filter(Boolean).length;
  return {
    ...paper,
    crossrefId: normalizeDoi(crossref.DOI),
    publisher: crossref.publisher ?? "",
    issn: (crossref.ISSN ?? []).join("; "),
    publicationType: crossref.type ?? "",
    publishedDate: getCrossrefDate(crossref),
    verificationStatus: matchCount >= 2 ? "verified" : matchCount >= 1 ? "partial" : "unverified",
    verificationReason: checks.join("; ")
  };
}

function getCrossrefYear(work: CrossrefWork): number | null {
  return work.published?.["date-parts"]?.[0]?.[0] ?? work["published-online"]?.["date-parts"]?.[0]?.[0] ?? work["published-print"]?.["date-parts"]?.[0]?.[0] ?? null;
}

function getCrossrefDate(work: CrossrefWork): string {
  const parts = work.published?.["date-parts"]?.[0] ?? work["published-online"]?.["date-parts"]?.[0] ?? work["published-print"]?.["date-parts"]?.[0];
  if (!parts?.length) return "";
  const [year, month = 1, day = 1] = parts;
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}

function isSimilarText(left: string, right: string): boolean {
  const leftTokens = tokenize(left);
  const rightTokens = new Set(tokenize(right));
  if (!leftTokens.length || !rightTokens.size) return false;
  const overlap = leftTokens.filter((token) => rightTokens.has(token)).length / leftTokens.length;
  return overlap >= 0.6;
}

function reconstructAbstract(index: OpenAlexWork["abstract_inverted_index"]): string {
  if (!index) return "";
  const words: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words.push([position, word]);
  }
  return words
    .sort(([left], [right]) => left - right)
    .map(([, word]) => word)
    .join(" ");
}

function mapAuthors(work: OpenAlexWork): string {
  const authors = (work.authorships ?? [])
    .map((authorship) => authorship.author?.display_name)
    .filter((name): name is string => Boolean(name));
  return authors.slice(0, 5).join(", ") || "Unknown authors";
}

function normalizeDoi(doi: string | null | undefined): string {
  return doi?.replace(/^https?:\/\/doi\.org\//i, "") ?? "";
}

function mapOaStatus(openAccess: OpenAlexWork["open_access"]): PaperSummary["oaStatus"] {
  if (!openAccess) return "unknown";
  if (openAccess.is_oa) return "oa";
  return openAccess.oa_status === "closed" ? "closed" : "unknown";
}

function scorePaper(input: { keyword: string; title: string; abstract: string; citedByCount: number; year: number }) {
  const titleScore = keywordOverlap(input.keyword, input.title);
  const abstractScore = keywordOverlap(input.keyword, input.abstract);
  const citationScore = Math.min(input.citedByCount / 100, 1);
  const recencyScore = scoreRecency(input.year);
  const finalScore = calculateFinalScore({
    abstractRelevance: abstractScore,
    titleRelevance: titleScore,
    journalQuality: 0.5,
    citationInfluence: citationScore,
    recency: recencyScore
  });
  const reason = [
    `title keyword overlap ${titleScore.toFixed(2)}`,
    `abstract keyword overlap ${abstractScore.toFixed(2)}`,
    `citations ${input.citedByCount}`,
    `year ${input.year || "unknown"}`
  ].join("; ");
  return {
    abstractScore: roundScore(abstractScore),
    finalScore: roundScore(finalScore),
    reason
  };
}

function keywordOverlap(keyword: string, text: string): number {
  const keywordTerms = tokenize(keyword);
  if (!keywordTerms.length) return 0;
  const textTerms = new Set(tokenize(text));
  const matches = keywordTerms.filter((term) => textTerms.has(term)).length;
  return matches / keywordTerms.length;
}

function tokenize(value: string): string[] {
  return Array.from(new Set(value.toLowerCase().match(/[a-z0-9가-힣]+/g) ?? [])).filter((term) => term.length > 1);
}

function scoreRecency(year: number): number {
  if (!year) return 0;
  const currentYear = new Date().getUTCFullYear();
  return Math.max(0, Math.min(1, 1 - (currentYear - year) / 10));
}

function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}

async function getSearchResult(db: D1Database, jobId: string): Promise<{ job: SearchJob; papers: PaperSummary[] } | null> {
  const jobRow = await db.prepare("SELECT * FROM search_jobs WHERE id = ?").bind(jobId).first<SearchJobRow>();
  if (!jobRow) return null;

  const paperRows = await db
    .prepare(
      `SELECT
        p.id,
        p.rank,
        p.title,
        p.authors,
        p.year,
        p.journal_name,
        p.doi,
        p.oa_status,
        p.publisher,
        p.issn,
        p.publication_type,
        p.published_date,
        p.verification_status,
        p.verification_reason,
        e.abstract_score,
        e.final_score,
        e.include_status,
        e.relevance_reason
       FROM papers p
       LEFT JOIN evaluations e ON e.paper_id = p.id
       WHERE p.job_id = ?
       ORDER BY p.rank ASC`
    )
    .bind(jobId)
    .all<PaperSummaryRow>();

  return {
    job: mapSearchJob(jobRow),
    papers: paperRows.results.map(mapPaperSummary)
  };
}

function mapSearchJob(row: SearchJobRow): SearchJob {
  return {
    id: row.id,
    keyword: row.keyword,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    errorMessage: row.error_message ?? undefined
  };
}

function mapPaperSummary(row: PaperSummaryRow): PaperSummary {
  return {
    id: row.id,
    rank: row.rank,
    title: row.title,
    authors: row.authors,
    year: row.year,
    journalName: row.journal_name,
    doi: row.doi,
    oaStatus: row.oa_status,
    abstractScore: row.abstract_score ?? 0,
    finalScore: row.final_score ?? 0,
    includeStatus: row.include_status ?? "review",
    relevanceReason: row.relevance_reason ?? "No evaluation recorded.",
    publisher: row.publisher ?? "",
    issn: row.issn ?? "",
    publicationType: row.publication_type ?? "",
    publishedDate: row.published_date ?? "",
    verificationStatus: row.verification_status ?? "unverified",
    verificationReason: row.verification_reason ?? "No verification recorded."
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

function csv(result: { job: SearchJob; papers: PaperSummary[] }): Response {
  const headers = [
    "job_id",
    "keyword",
    "rank",
    "title",
    "authors",
    "year",
    "journal_name",
    "doi",
    "oa_status",
    "publisher",
    "issn",
    "publication_type",
    "published_date",
    "verification_status",
    "verification_reason",
    "abstract_score",
    "final_score",
    "include_status",
    "relevance_reason"
  ];
  const rows = result.papers.map((paper) => [
    result.job.id,
    result.job.keyword,
    paper.rank,
    paper.title,
    paper.authors,
    paper.year,
    paper.journalName,
    paper.doi,
    paper.oaStatus,
    paper.publisher ?? "",
    paper.issn ?? "",
    paper.publicationType ?? "",
    paper.publishedDate ?? "",
    paper.verificationStatus ?? "",
    paper.verificationReason ?? "",
    paper.abstractScore,
    paper.finalScore,
    paper.includeStatus,
    paper.relevanceReason
  ]);
  const body = [headers, ...rows].map((row) => row.map(formatCsvCell).join(",")).join("\n");
  const fileName = `${sanitizeFileName(result.job.keyword)}-${result.job.id}.csv`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      ...corsHeaders()
    }
  });
}

function formatCsvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "papers";
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Worker error";
}
