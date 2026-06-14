import type { AgentRole } from "./agent.js";

export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "ready_for_review"
  | "reviewing"
  | "changes_requested"
  | "fixing"
  | "approved"
  | "integrated"
  | "testing"
  | "failed"
  | "tested"
  | "accepted"
  | "blocked";

export interface TaskNode {
  id: string;
  title: string;
  owner: AgentRole;
  status: TaskStatus;
  depends_on: string[];
  stack_profile: string;
  workspace: string;
  inputs: string[];
  outputs: string[];
  allowed_paths: string[];
  verification_commands: string[];
  attempt: number;
  max_attempts: number;
}

export interface TaskGraph {
  version: "1.0";
  project_id: string;
  run_id: string;
  tasks: TaskNode[];
}
