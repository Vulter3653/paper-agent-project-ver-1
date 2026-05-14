-- Adds Crossref enrichment and verifier columns to an existing D1 papers table.
-- Run each ALTER TABLE statement only if the column is missing from:
-- PRAGMA table_info(papers);

ALTER TABLE papers ADD COLUMN crossref_id TEXT;
ALTER TABLE papers ADD COLUMN publisher TEXT;
ALTER TABLE papers ADD COLUMN issn TEXT;
ALTER TABLE papers ADD COLUMN publication_type TEXT;
ALTER TABLE papers ADD COLUMN published_date TEXT;
ALTER TABLE papers ADD COLUMN verification_status TEXT;
ALTER TABLE papers ADD COLUMN verification_reason TEXT;
