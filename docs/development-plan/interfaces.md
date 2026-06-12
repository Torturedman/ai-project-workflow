# TypeScript 核心接口

## 1. API Response

```ts
export interface ApiResponse<TData = unknown> {
  ok: boolean;
  code: string;
  message: string;
  run_id?: string;
  project_id?: string;
  data?: TData;
  warnings?: string[];
  retryable?: boolean;
  details?: Record<string, unknown>;
  evidence?: Record<string, string>;
}
```

## 2. Stack Profile

```ts
export type ArchitectureMode = "simple" | "standard" | "microservice";

export interface StackProfile {
  id: string;
  display_name: string;
  architecture_modes: ArchitectureMode[];
  backend: {
    language: string;
    framework: string;
    package_manager: string;
    root_dir: string;
    dev_command: string;
    build_command: string;
    test_command: string;
    lint_command: string;
    api_docs_path: string;
    healthcheck_path: string;
  };
  frontend: {
    language: string;
    framework: string;
    package_manager: string;
    root_dir: string;
    dev_command: string;
    build_command: string;
    test_command: string;
    lint_command: string;
    port: number;
  };
  database: {
    engine: "postgresql" | "mysql" | "sqlite";
    version: string;
    orm: string;
    migration_command: string;
    seed_command: string;
    connection_env: string;
  };
  container: {
    compose_file: string;
    up_command: string;
    down_command: string;
  };
  verification: {
    install_command: string;
    lint_command: string;
    test_command: string;
    build_command: string;
    e2e_command: string;
    dev_command: string;
  };
  template: {
    id: string;
    root: string;
  };
}
```

## 3. Agent Runner

```ts
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
```

## 4. Task Graph

```ts
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
```

## 5. Review Report

```ts
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
```

## 6. Test 和启动证据

```ts
export type VerificationStatus = "passed" | "failed" | "skipped";

export interface CommandEvidence {
  name: string;
  command: string;
  cwd: string;
  status: VerificationStatus;
  exit_code: number;
  started_at: string;
  ended_at: string;
  stdout_log: string;
  stderr_log: string;
}

export interface TestReport {
  version: "1.0";
  run_id: string;
  status: VerificationStatus;
  commands: CommandEvidence[];
  failures: FactoryError[];
}

export interface StartupEvidence {
  version: "1.0";
  run_id: string;
  status: VerificationStatus;
  started_at: string;
  services: Array<{
    name: string;
    url: string;
    port: number;
    healthcheck_url?: string;
    status: VerificationStatus;
    http_status?: number;
    pid?: number;
    container?: string;
    log_tail: string;
  }>;
  frontend_url?: string;
  backend_url?: string;
  api_docs_url?: string;
  evidence_files: string[];
}
```

