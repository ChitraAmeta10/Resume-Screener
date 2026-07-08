export type Role = "recruiter" | "admin";
export type Stage = "new" | "screened" | "interview" | "offer" | "rejected";

export interface User {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  created_at: string;
}

export interface Education {
  degree?: string | null;
  institution?: string | null;
  year?: number | null;
}

export interface Candidate {
  id: string;
  job_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  experience_years: number;
  education: Education[];
  status: Stage;
  created_at: string;
}

export interface Score {
  similarity_score: number;
  llm_score: number;
  llm_reasoning?: string | null;
  final_score: number;
}

export interface RankedCandidate {
  candidate: Candidate;
  score: Score;
}

export interface CandidateSkillGap {
  candidate_id: string;
  full_name: string;
  matched: string[];
  missing: string[];
  coverage: number;
}

export interface SkillGapReport {
  required_skills: string[];
  candidates: CandidateSkillGap[];
}

export interface PooledCandidate {
  candidate_id: string;
  full_name: string;
  email?: string | null;
  experience_years: number;
  skills: string[];
  job_id: string;
  job_title: string;
  status: Stage;
  final_score: number;
  coverage?: number | null;
}

export interface FitDistribution {
  strong: number;
  moderate: number;
  weak: number;
}

export interface JobSummary {
  id: string;
  title: string;
  candidate_count: number;
  scored_count: number;
  avg_score: number;
  strong_count: number;
}

export interface TopCandidate {
  candidate_id: string;
  full_name: string;
  job_id: string;
  job_title: string;
  final_score: number;
  coverage?: number | null;
}

export interface SkillCount {
  skill: string;
  count: number;
}

export interface Dashboard {
  scope: "team" | "personal";
  recruiters: number;
  total_jobs: number;
  total_candidates: number;
  scored_candidates: number;
  avg_fit_score: number;
  fit_distribution: FitDistribution;
  jobs: JobSummary[];
  top_candidates: TopCandidate[];
  top_skills: SkillCount[];
  llm_provider: string;
  database: string;
}

export interface UploadError {
  filename: string;
  error: string;
}
export interface UploadResponse {
  created: Candidate[];
  errors: UploadError[];
}
