import type { FactoryConfig } from "./schema.js";

export const defaultConfig: FactoryConfig = {
  // Controls which stack profile is selected when the user does not pass one.
  // Changing this shifts the default generated project stack and test surface.
  default_profile: "node-next",
  // The default runner affects whether local workflows call external AI tools.
  // Keep "mock" as the safe baseline until runner credentials are configured.
  default_runner: "mock",
  architecture_mode: "standard",
  paths: {
    // Global state location impacts config discovery, logs, and SQLite indexes.
    // Moving it can orphan previous run history unless migration is planned.
    global_home: "~/.ai-factory",
    default_output_dir: "./generated",
  },
  execution: {
    // Parallelism controls AI runner/process fan-out. Raising it increases
    // local CPU, memory, filesystem, and external API pressure.
    max_parallel_agents: 3,
    agent_timeout_seconds: 1800,
    command_timeout_seconds: 900,
    require_user_approval_before_execution: true,
  },
  retry: {
    max_fix_rounds: 5,
    max_same_issue_rounds: 3,
    max_runner_retries: 2,
  },
  logging: {
    level: "info",
    retain_project_logs: true,
    // Retention affects disk usage and auditability; lower values may remove
    // evidence needed for failed run investigation.
    global_retention_days: 30,
    max_log_file_mb: 50,
  },
  supported_profiles: ["node-next", "python-fastapi-react", "java-spring-vue"],
};
