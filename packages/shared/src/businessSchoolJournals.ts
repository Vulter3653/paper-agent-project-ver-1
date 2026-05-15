export const BUSINESS_SCHOOL_JOURNALS = [
  "Management Science",
  "Harvard Business Review",
  "MIT Sloan Management Review",
  "California Management Review",
  "Journal of Business Research",
  "Journal of Business Ethics",
  "경영학연구",
  "Academy of Management Review",
  "Academy of Management Journal",
  "Administrative Science Quarterly",
  "Strategic Management Journal",
  "Journal of Management",
  "Personnel Psychology",
  "Journal of Applied Psychology",
  "Organization Science",
  "Organizational Behavior and Human Decision Processes",
  "Journal of Management Studies",
  "Entrepreneurship Theory and Practice",
  "Journal of Organizational Behavior",
  "Human Resource Management",
  "Industrial & Labor Relations Review",
  "Organization Studies",
  "The Leadership Quarterly",
  "인사조직연구",
  "조직과인사관리연구",
  "전략경영연구",
  "산업관계연구",
  "The Accounting Review",
  "Journal of Accounting and Economics",
  "Journal of Accounting Research",
  "Contemporary Accounting Research",
  "Review of Accounting Studies",
  "Accounting, Organisation and Society",
  "Journal of Accounting and Public Policy",
  "Journal of Business, Finance and Accounting",
  "Accounting Horizons",
  "Auditing: A Journal of Practice & Theory",
  "European Accounting Review",
  "Management Accounting Research",
  "Abacus: A Journal of Accounting Finance and Business Studies",
  "Asia-Pacific Journal of Accounting and Economics",
  "Accounting and Finance",
  "Journal of International Financial Management & Accounting",
  "회계저널",
  "회계학연구",
  "회계·세무와감사연구",
  "세무학연구",
  "Journal of Finance",
  "Journal of Financial Economics",
  "Review of Financial Studies",
  "Journal of Financial and Quantitative Analysis",
  "Journal of Banking and Finance",
  "Financial Management",
  "Journal of Corporate Finance",
  "Journal of Empirical Finance",
  "Journal of Financial Markets",
  "Journal of Financial Intermediation",
  "Journal of International Money and Finance",
  "Financial Analyst Journal",
  "Journal of Futures Markets",
  "Journal of Portfolio Management",
  "European Financial Management",
  "Review of Finance",
  "재무연구",
  "한국증권학회지",
  "금융연구",
  "Journal of Marketing Research",
  "Journal of Consumer Research",
  "Marketing Science",
  "Journal of Marketing",
  "Journal of Retailing",
  "Journal of Product Innovation Management",
  "Journal of Consumer Psychology",
  "Journal of the Academy of Marketing Science",
  "International Journal of Research in Marketing",
  "Journal of Interactive Marketing",
  "Industrial Marketing Management",
  "Journal of International Marketing",
  "Journal of Advertising",
  "Psychology & Marketing",
  "Journal of Service Research",
  "International Marketing Review",
  "마케팅연구",
  "소비자학연구",
  "광고학연구",
  "유통연구",
  "MIS Quarterly",
  "Information Systems Research",
  "Journal of Management Information Systems",
  "IEEE Transactions on Engineering Management",
  "Information & Management",
  "Communications of the ACM",
  "Decision Support System",
  "Journal of AIS",
  "Journal of the American Society for Information Science and Technology",
  "International Journal of Electronic Commerce",
  "European Journal of Information Systems",
  "Computers in Human Behavior",
  "Information Systems Journal",
  "Journal of Information Technology",
  "Journal of Strategic Information Systems",
  "APJIS",
  "경영정보학연구",
  "Information Systems Review",
  "지능정보연구",
  "Journal of Operations Management",
  "Operations Research",
  "Decision Sciences",
  "Supply Chain Management: An International Journal",
  "Production and Operations Management",
  "International Journal of Production Economics",
  "European Journal of Operational Research",
  "International Journal of Operations and Production Management",
  "IIE Transactions",
  "International Journal of Production Research",
  "Manufacturing & Service Operations Management",
  "Omega",
  "한국생산관리학회지",
  "경영과학",
  "로지스틱스학연구",
  "Journal of International Business Studies",
  "Journal of World Business",
  "International Journal of Management Reviews",
  "Journal of International Management",
  "Journal of Risk and Uncertainty",
  "British Journal of Management",
  "International Business Review",
  "Management International Review",
  "Journal of Risk and Insurance",
  "Asian Business & Management",
  "Journal of World Trade",
  "European Journal of International Management",
  "Asia Pacific Journal of Management",
  "무역학회지",
  "국제경영연구",
  "무역상무연구"
] as const;

export type BusinessSchoolJournalCategory = {
  id: string;
  order: number;
  label: string;
  internationalS: readonly string[];
  internationalA1: readonly string[];
  domesticA: readonly string[];
};

export type BusinessSchoolJournalRank = "international_s" | "international_a1" | "domestic_a";

export type BusinessSchoolJournalMatch = {
  categoryId: string;
  categoryLabel: string;
  rank: BusinessSchoolJournalRank;
  rankLabel: string;
};

export const BUSINESS_SCHOOL_JOURNAL_CATEGORIES = [
  {
    id: "common",
    order: 1,
    label: "1. 공통",
    internationalS: ["Management Science", "Harvard Business Review"],
    internationalA1: ["MIT Sloan Management Review", "California Management Review", "Journal of Business Research", "Journal of Business Ethics"],
    domesticA: ["경영학연구"]
  },
  {
    id: "organization-hr",
    order: 2,
    label: "2. 조직인사",
    internationalS: ["Academy of Management Review", "Academy of Management Journal", "Administrative Science Quarterly", "Strategic Management Journal"],
    internationalA1: [
      "Journal of Management",
      "Personnel Psychology",
      "Journal of Applied Psychology",
      "Organization Science",
      "Organizational Behavior and Human Decision Processes",
      "Journal of Management Studies",
      "Entrepreneurship Theory and Practice",
      "Journal of Organizational Behavior",
      "Human Resource Management",
      "Industrial & Labor Relations Review",
      "Organization Studies",
      "The Leadership Quarterly"
    ],
    domesticA: ["인사조직연구", "조직과인사관리연구", "전략경영연구", "산업관계연구"]
  },
  {
    id: "accounting",
    order: 3,
    label: "3. 회계학",
    internationalS: ["The Accounting Review", "Journal of Accounting and Economics", "Journal of Accounting Research", "Contemporary Accounting Research"],
    internationalA1: [
      "Review of Accounting Studies",
      "Accounting, Organisation and Society",
      "Journal of Accounting and Public Policy",
      "Journal of Business, Finance and Accounting",
      "Accounting Horizons",
      "Auditing: A Journal of Practice & Theory",
      "European Accounting Review",
      "Management Accounting Research",
      "Abacus: A Journal of Accounting Finance and Business Studies",
      "Asia-Pacific Journal of Accounting and Economics",
      "Accounting and Finance",
      "Journal of International Financial Management & Accounting"
    ],
    domesticA: ["회계저널", "회계학연구", "회계·세무와감사연구", "세무학연구"]
  },
  {
    id: "finance",
    order: 4,
    label: "4. 재무",
    internationalS: ["Journal of Finance", "Journal of Financial Economics", "Review of Financial Studies", "Journal of Financial and Quantitative Analysis"],
    internationalA1: [
      "Journal of Banking and Finance",
      "Financial Management",
      "Journal of Corporate Finance",
      "Journal of Empirical Finance",
      "Journal of Financial Markets",
      "Journal of Financial Intermediation",
      "Journal of International Money and Finance",
      "Financial Analyst Journal",
      "Journal of Futures Markets",
      "Journal of Portfolio Management",
      "European Financial Management",
      "Review of Finance"
    ],
    domesticA: ["재무연구", "한국증권학회지", "금융연구"]
  },
  {
    id: "marketing",
    order: 5,
    label: "5. 마케팅",
    internationalS: ["Journal of Marketing Research", "Journal of Consumer Research", "Marketing Science", "Journal of Marketing"],
    internationalA1: [
      "Journal of Retailing",
      "Journal of Product Innovation Management",
      "Journal of Consumer Psychology",
      "Journal of the Academy of Marketing Science",
      "International Journal of Research in Marketing",
      "Journal of Interactive Marketing",
      "Industrial Marketing Management",
      "Journal of International Marketing",
      "Journal of Advertising",
      "Psychology & Marketing",
      "Journal of Service Research",
      "International Marketing Review"
    ],
    domesticA: ["마케팅연구", "소비자학연구", "광고학연구", "유통연구"]
  },
  {
    id: "information-systems",
    order: 6,
    label: "6. 경영정보",
    internationalS: ["MIS Quarterly", "Information Systems Research", "Journal of Management Information Systems"],
    internationalA1: [
      "IEEE Transactions on Engineering Management",
      "Information & Management",
      "Communications of the ACM",
      "Decision Support System",
      "Journal of AIS",
      "Journal of the American Society for Information Science and Technology",
      "International Journal of Electronic Commerce",
      "European Journal of Information Systems",
      "Computers in Human Behavior",
      "Information Systems Journal",
      "Journal of Information Technology",
      "Journal of Strategic Information Systems"
    ],
    domesticA: ["APJIS", "경영정보학연구", "Information Systems Review", "지능정보연구"]
  },
  {
    id: "operations",
    order: 7,
    label: "7. 생산운영",
    internationalS: ["Journal of Operations Management", "Management Science", "Operations Research"],
    internationalA1: [
      "Decision Sciences",
      "Supply Chain Management: An International Journal",
      "Production and Operations Management",
      "International Journal of Production Economics",
      "European Journal of Operational Research",
      "International Journal of Operations and Production Management",
      "IIE Transactions",
      "International Journal of Production Research",
      "Manufacturing & Service Operations Management",
      "Omega"
    ],
    domesticA: ["한국생산관리학회지", "경영과학", "로지스틱스학연구"]
  },
  {
    id: "international-business",
    order: 8,
    label: "8. 무역/국제경영",
    internationalS: [
      "Journal of International Business Studies",
      "Journal of World Business",
      "Supply Chain Management: An International Journal",
      "International Journal of Management Reviews"
    ],
    internationalA1: [
      "Journal of International Management",
      "Journal of International Marketing",
      "Journal of Risk and Uncertainty",
      "British Journal of Management",
      "International Marketing Review",
      "International Business Review",
      "Management International Review",
      "Journal of Risk and Insurance",
      "Asian Business & Management",
      "Journal of World Trade",
      "European Journal of International Management",
      "Asia Pacific Journal of Management"
    ],
    domesticA: ["무역학회지", "국제경영연구", "무역상무연구"]
  }
] as const satisfies readonly BusinessSchoolJournalCategory[];

export const BUSINESS_SCHOOL_JOURNAL_CATEGORY_OPTIONS = BUSINESS_SCHOOL_JOURNAL_CATEGORIES.map(({ id, label }) => ({ id, label })) as ReadonlyArray<{
  id: string;
  label: string;
}>;

export const BUSINESS_SCHOOL_JOURNAL_SET = new Set(BUSINESS_SCHOOL_JOURNALS.map(normalizeJournalName));

export function normalizeJournalName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bthe\b/g, " ")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isBusinessSchoolJournal(value: string): boolean {
  return BUSINESS_SCHOOL_JOURNAL_SET.has(normalizeJournalName(value));
}

export function getBusinessSchoolJournalMatch(value: string, preferredCategoryId?: string): BusinessSchoolJournalMatch | undefined {
  const normalized = normalizeJournalName(value);
  const normalizedSingular = normalized.endsWith("s") ? normalized.slice(0, -1) : normalized;
  const categories = preferredCategoryId
    ? [
        ...BUSINESS_SCHOOL_JOURNAL_CATEGORIES.filter((category) => category.id === preferredCategoryId),
        ...BUSINESS_SCHOOL_JOURNAL_CATEGORIES.filter((category) => category.id !== preferredCategoryId)
      ]
    : BUSINESS_SCHOOL_JOURNAL_CATEGORIES;

  for (const category of categories) {
    const rankMatch =
      getRankMatch(category.internationalS, normalized, normalizedSingular, "international_s", "국제 S급") ??
      getRankMatch(category.internationalA1, normalized, normalizedSingular, "international_a1", "국제 A1급") ??
      getRankMatch(category.domesticA, normalized, normalizedSingular, "domestic_a", "국내 A급");

    if (rankMatch) {
      return {
        categoryId: category.id,
        categoryLabel: category.label,
        ...rankMatch
      };
    }
  }

  return undefined;
}

export function getBusinessSchoolJournalCategory(categoryId: string | undefined): BusinessSchoolJournalCategory | undefined {
  if (!categoryId) return undefined;
  return BUSINESS_SCHOOL_JOURNAL_CATEGORIES.find((category) => category.id === categoryId);
}

export function getPriorityInternationalJournals(categoryId: string | undefined): readonly string[] {
  const category = getBusinessSchoolJournalCategory(categoryId);
  if (!category) return [];
  return [...category.internationalS, ...category.internationalA1];
}

function getRankMatch(
  journals: readonly string[],
  normalized: string,
  normalizedSingular: string,
  rank: BusinessSchoolJournalRank,
  rankLabel: string
): Pick<BusinessSchoolJournalMatch, "rank" | "rankLabel"> | undefined {
  const matches = journals.some((journal) => {
    const normalizedJournal = normalizeJournalName(journal);
    return normalizedJournal === normalized || normalizedJournal === normalizedSingular;
  });
  return matches ? { rank, rankLabel } : undefined;
}
