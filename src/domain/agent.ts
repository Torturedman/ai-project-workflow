import type { FactoryError } from "./errors.js";
import type { StackProfile } from "./profile.js";
import type { ReviewIssue } from "./review.js";

export type AgentRole =
  | "intake"
  | "planner"
  | "research"
  | "judge"
  | "architect"
  | "task-graph"
  | "dev-backend"
  | "dev-frontend"
  | "dev-db"
  | "review"
  | "test-qa";

export interface AgentTask {
  id: string;
  role: AgentRole;
  title: string;
  task_file: string;
  workspace_dir: string;
  expected_outputs: string[];
  constraints: string[];
}

export interface AgentContext {
  project_dir: string;
  factory_dir: string;
  run_id: string;
  project_id: string;
  stack_profile: StackProfile;
  status_file: string;
  task_graph_file: string;
  memory_file?: string;
  retry?: {
    attempt: number;
    previous_issues: ReviewIssue[];
  };
}

export interface AgentResult {
  ok: boolean;
  role: AgentRole;
  task_id: string;
  invocation_id: string;
  exit_code: number;
  started_at: string;
  ended_at: string;
  stdout_log: string;
  stderr_log: string;
  report_json: string;
  report_md: string;
  changed_files: string[];
  errors: FactoryError[];
}

export interface AgentRunner {
  id: string;
  run(task: AgentTask, context: AgentContext): Promise<AgentResult>;
}
