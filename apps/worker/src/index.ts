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
      const body = await readJson<CreateSearchJobRequest>(request);
      const job = createDemoJob(body.keyword ?? "AI interview employer branding");
      return json({ job, papers: demoPapers });
    }

    const jobMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)$/);
    if (jobMatch && request.method === "GET") {
      const job = createDemoJob("AI interview employer branding", jobMatch[1]);
      return json({ job, papers: demoPapers });
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

function createDemoJob(keyword: string, id = `job-${Date.now()}`): SearchJob {
  return {
    id,
    keyword,
    status: "completed",
    currentStep: "ranking",
    totalSteps: 12,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
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
