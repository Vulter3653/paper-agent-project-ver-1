#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

const DEFAULT_INPUT = "benchmark/gold_relevant_papers.csv";
const DEFAULT_OUTPUT = "benchmark/gold_relevant_papers.verified.csv";
const CROSSREF_API = "https://api.crossref.org/works";

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input ?? DEFAULT_INPUT;
const outputPath = args.output ?? DEFAULT_OUTPUT;
const limit = args.limit ? Number.parseInt(args.limit, 10) : Number.POSITIVE_INFINITY;
const contactEmail = process.env.CROSSREF_EMAIL ?? process.env.UNPAYWALL_EMAIL ?? process.env.CONTACT_EMAIL ?? "";
const politeDelayMs = args.delayMs ? Number.parseInt(args.delayMs, 10) : 1100;

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
const verifiedRows = [];
let checked = 0;
let verified = 0;
let ambiguous = 0;
let noMatch = 0;
let failed = 0;

for (const row of rows) {
  if (checked >= limit) {
    verifiedRows.push(row);
    continue;
  }

  const needsVerification = !row.doi || row.doi_label_status === "needs_crossref_verification";
  if (!needsVerification) {
    verifiedRows.push(row);
    continue;
  }

  checked += 1;
  try {
    const candidates = await queryCrossref(row.title, contactEmail);
    const best = selectBestCandidate(row, candidates);
    if (!best) {
      noMatch += 1;
      verifiedRows.push({
        ...row,
        doi_label_status: "no_match",
        notes: appendNote(row.notes, "Crossref title query returned no acceptable candidate.")
      });
    } else if (best.status === "ambiguous") {
      ambiguous += 1;
      verifiedRows.push({
        ...row,
        doi: normalizeDoi(best.work.DOI ?? ""),
        authors: formatAuthors(best.work.author),
        year: String(getCrossrefYear(best.work) ?? row.year),
        journal: best.work["container-title"]?.[0] ?? row.journal,
        doi_label_status: "ambiguous",
        notes: appendNote(row.notes, `Crossref candidate below verification threshold; score=${best.score.toFixed(2)}.`)
      });
    } else {
      verified += 1;
      verifiedRows.push({
        ...row,
        title: best.work.title?.[0] ?? row.title,
        authors: formatAuthors(best.work.author),
        year: String(getCrossrefYear(best.work) ?? row.year),
        journal: best.work["container-title"]?.[0] ?? row.journal,
        doi: normalizeDoi(best.work.DOI ?? ""),
        doi_label_status: "verified",
        notes: appendNote(row.notes, `Crossref title match score=${best.score.toFixed(2)}.`)
      });
    }
  } catch (error) {
    failed += 1;
    verifiedRows.push({
      ...row,
      doi_label_status: "lookup_failed",
      notes: appendNote(row.notes, `Crossref lookup failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }

  if (checked < Math.min(limit, rows.length)) await sleep(politeDelayMs);
}

fs.writeFileSync(outputPath, stringifyCsv(verifiedRows), "utf8");
console.log(
  JSON.stringify(
    {
      input: inputPath,
      output: outputPath,
      checked,
      verified,
      ambiguous,
      noMatch,
      failed,
      contactEmail: Boolean(contactEmail)
    },
    null,
    2
  )
);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") parsed.input = argv[++i];
    else if (arg === "--output") parsed.output = argv[++i];
    else if (arg === "--limit") parsed.limit = argv[++i];
    else if (arg === "--delay-ms") parsed.delayMs = argv[++i];
  }
  return parsed;
}

async function queryCrossref(title, email) {
  const url = new URL(CROSSREF_API);
  url.searchParams.set("query.title", title);
  url.searchParams.set("rows", "5");
  url.searchParams.set("select", "DOI,title,author,container-title,published-print,published-online,issued,score,type,publisher");
  if (email) url.searchParams.set("mailto", email);

  const response = await fetchWithRetry(url);
  const data = await response.json();
  return data?.message?.items ?? [];
}

async function fetchWithRetry(url) {
  let lastResponse = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "paper-agent-benchmark/1.0" } });
    if (response.ok) return response;
    lastResponse = response;
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
    await sleep(800 * (attempt + 1));
  }
  throw new Error(`Crossref request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function selectBestCandidate(row, candidates) {
  if (!candidates.length) return null;
  const scored = candidates
    .map((work) => {
      const candidateTitle = work.title?.[0] ?? "";
      const titleScore = textSimilarity(row.title, candidateTitle);
      const candidateYear = getCrossrefYear(work);
      const expectedYear = Number.parseInt(row.year, 10);
      const yearScore = candidateYear && expectedYear ? Math.max(0, 1 - Math.min(Math.abs(candidateYear - expectedYear), 5) / 5) : 0.5;
      const score = titleScore * 0.85 + yearScore * 0.15;
      return { work, score, titleScore };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || !best.work.DOI) return null;
  if (best.titleScore >= 0.72 && best.score >= 0.68) return { ...best, status: "verified" };
  if (best.titleScore >= 0.52 && best.score >= 0.5) return { ...best, status: "ambiguous" };
  return null;
}

function textSimilarity(left, right) {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

function tokenize(value) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function normalizeDoi(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return "To be verified";
  return authors
    .slice(0, 6)
    .map((author) => [author.given, author.family].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ");
}

function getCrossrefYear(work) {
  return (
    work?.published?.["date-parts"]?.[0]?.[0] ??
    work?.["published-print"]?.["date-parts"]?.[0]?.[0] ??
    work?.["published-online"]?.["date-parts"]?.[0]?.[0] ??
    work?.issued?.["date-parts"]?.[0]?.[0] ??
    null
  );
}

function appendNote(existing, note) {
  return existing ? `${existing} ${note}` : note;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function stringifyCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","))].join("\n") + "\n";
}

function escapeCsv(value) {
  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}
