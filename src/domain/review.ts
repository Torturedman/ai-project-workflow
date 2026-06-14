import type { AgentRole } from "./agent.js";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface ReviewIssue {
  id: string;
  severity: IssueSeverity;
  owner: AgentRole;
  task_id: string;
  file: string;
  line?: number;
  problem: string;
  expected_fix: string;
  evidence?: string;
}

export interface ReviewReport {
  version: "1.0";
  approved: boolean;
  run_id: string;
  reviewed_at: string;
  summary: string;
  issues: ReviewIssue[];
}
