-- Adds persisted score breakdown columns to an existing D1 evaluations table.
-- Run each ALTER TABLE statement only if the column is missing from:
-- PRAGMA table_info(evaluations);

ALTER TABLE evaluations ADD COLUMN relevance_score REAL DEFAULT 0;
ALTER TABLE evaluations ADD COLUMN journal_fit_score REAL DEFAULT 0;
ALTER TABLE evaluations ADD COLUMN verification_score REAL DEFAULT 0;
ALTER TABLE evaluations ADD COLUMN oa_score REAL DEFAULT 0;
ALTER TABLE evaluations ADD COLUMN citation_score REAL DEFAULT 0;
ALTER TABLE evaluations ADD COLUMN recency_score REAL DEFAULT 0;
