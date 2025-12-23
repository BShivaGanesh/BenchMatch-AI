export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  description?: string;
}

export type MatchStatus = "Matched" | "In Progress";

export interface MatchHistoryItem {
  id: string;
  requirementId: string;
  dateSubmitted: string;
  status: MatchStatus;
  topCandidateFitScore: number;
}

export interface SkillGapItem {
  skill: string;
  missingCount: number;
}

export type BenchStatus = "Bench" | "Partial" | "Not Bench";

export interface Candidate {
  id: string;
  rank: number;
  name: string;
  email: string;
  role: string;
  overallFitScore: number; // 0-100
  skillMatchScore: number; // 0-100
  benchStatus: BenchStatus;
  reasonForRanking: string;
  strengths: string[];
  gaps: string[];
  experienceSummary: string;
  certifications: string[];
}

export interface RequirementFormValues {
  clientName: string;
  roleTitle: string;
  requiredSkills: string[];
  minimumExperience: number | "";
  mandatoryCertifications: string;
  availabilityDate: string;
  summary: string;
}
