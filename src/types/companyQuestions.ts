export interface CompanyQuestionCandidate {
  id: string;
  title: string;
  prompt: string;
  difficulty: "Medium" | "Hard";
  frequency: number;
  recency: "Fresh" | "Recent" | "Evergreen";
  sourceTitles: string[];
  sourceUrls: string[];
  tags: string[];
}

export interface CompanyQuestionResponse {
  company: string;
  generatedAt: string;
  query: string;
  source: "web" | "fallback";
  candidates: CompanyQuestionCandidate[];
  note?: string;
}
