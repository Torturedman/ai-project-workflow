import type { FactoryConfig } from "./schema.js";

export const defaultConfig: FactoryConfig = {
  default_profile: "node-next",
  default_runner: "mock",
  architecture_mode: "standard",
  paths: {
    global_home: "~/.ai-factory",
    default_output_dir: "./generated",
  },
  execution: {
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
    global_retention_days: 30,
    max_log_file_mb: 50,
  },
  supported_profiles: ["node-next", "python-fastapi-react", "java-spring-vue"],
};
