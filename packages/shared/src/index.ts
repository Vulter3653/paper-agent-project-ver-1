export type SearchJobStatus =
  | "queued"
  | "searching"
  | "enriching_metadata"
  | "checking_oa"
  | "scoring"
  | "ranking"
  | "generating_report"
  | "completed"
  | "failed";

export type SearchJob = {
  id: string;
  keyword: string;
  status: SearchJobStatus;
  currentStep: string;
  totalSteps: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
};

export type PaperSummary = {
  id: string;
  rank: number;
  title: string;
  authors: string;
  year: number;
  journalName: string;
  doi: string;
  oaStatus: "oa" | "closed" | "unknown";
  abstractScore: number;
  finalScore: number;
  includeStatus: "include" | "exclude" | "review";
  relevanceReason: string;
};

export type ScoreInput = {
  abstractRelevance: number;
  titleRelevance: number;
  journalQuality: number;
  citationInfluence: number;
  recency: number;
};

export function calculateFinalScore(input: ScoreInput): number {
  return (
    0.45 * input.abstractRelevance +
    0.2 * input.titleRelevance +
    0.15 * input.journalQuality +
    0.1 * input.citationInfluence +
    0.1 * input.recency
  );
}
