CREATE TABLE IF NOT EXISTS search_jobs (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step TEXT NOT NULL,
  total_steps INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  year INTEGER NOT NULL,
  journal_name TEXT NOT NULL,
  doi TEXT NOT NULL,
  oa_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL,
  abstract_score REAL NOT NULL,
  final_score REAL NOT NULL,
  include_status TEXT NOT NULL,
  relevance_reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_papers_job_id ON papers(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_paper_id ON evaluations(paper_id);
