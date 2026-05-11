import type { PaperSummary, SearchJob } from "@paper-agent/shared";

export interface Env {
  DB?: D1Database;
  REPORTS?: R2Bucket;
  OPENALEX_EMAIL?: string;
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

const demoPapers: PaperSummary[] = [
  {
    id: "demo-1",
    rank: 1,
    title: "Automated Scholarly Paper Discovery with Agentic Workflows",
    authors: "Kim, Lee, Park",
    year: 2025,
    journalName: "Journal of AI Research",
    doi: "10.0000/demo.1",
    oaStatus: "unknown",
    abstractScore: 0.91,
    finalScore: 0.88,
    includeStatus: "include",
    relevanceReason: "Keyword, abstract, and method terms are directly aligned."
  }
];

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
        const job = createDemoJob(body.keyword ?? "AI interview employer branding");
        await saveDemoSearchResult(env.DB, job, demoPapers);
        return json((await getSearchResult(env.DB, job.id)) ?? { job, papers: demoPapers });
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

function createDemoJob(keyword: string, id = `job-${crypto.randomUUID()}`): SearchJob {
  const now = new Date().toISOString();
  return {
    id,
    keyword,
    status: "completed",
    currentStep: "ranking",
    totalSteps: 12,
    createdAt: now,
    completedAt: now
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

async function saveDemoSearchResult(db: D1Database, job: SearchJob, papers: PaperSummary[]): Promise<void> {
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO search_jobs (id, keyword, status, current_step, total_steps, created_at, completed_at, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(job.id, job.keyword, job.status, job.currentStep, job.totalSteps, job.createdAt, job.completedAt ?? null, job.errorMessage ?? null)
  ];

  for (const paper of papers) {
    const paperId = `${job.id}-paper-${paper.rank}`;
    statements.push(
      db
        .prepare(
          `INSERT INTO papers (id, job_id, rank, title, authors, year, journal_name, doi, oa_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(paperId, job.id, paper.rank, paper.title, paper.authors, paper.year, paper.journalName, paper.doi, paper.oaStatus, now)
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
    relevanceReason: row.relevance_reason ?? "No evaluation recorded."
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
