export type ProjectStatus =
  | "intake"
  | "planning"
  | "researching"
  | "deciding"
  | "awaiting_user_approval"
  | "executing"
  | "integrating"
  | "testing"
  | "fixing"
  | "accepting"
  | "completed"
  | "blocked";

export interface ProjectState {
  version: "1.0";
  project_id: string;
  run_id: string;
  status: ProjectStatus;
  raw_request: string;
  selected_profile: string;
  architecture_mode: string;
  approval: {
    required: boolean;
    approved: boolean;
    approved_at: string | null;
  };
  current_phase: string;
  frontend_url: string | null;
  backend_url: string | null;
  api_docs_url: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
