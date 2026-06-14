import type { AgentRole } from "./agent.js";

export const factoryErrorCodes = [
  "CONFIG_NOT_FOUND",
  "CONFIG_INVALID",
  "PROFILE_UNSUPPORTED",
  "PROFILE_INVALID",
  "USER_APPROVAL_REQUIRED",
  "PLAN_REJECTED",
  "TASK_GRAPH_INVALID",
  "TASK_GRAPH_CYCLE",
  "TASK_OUTPUT_MISSING",
  "AGENT_COMMAND_FAILED",
  "AGENT_TIMEOUT",
  "AGENT_REPORT_MISSING",
  "REVIEW_HIGH_ISSUES",
  "TEST_FAILED",
  "STARTUP_HEALTHCHECK_FAILED",
  "PORT_UNAVAILABLE",
  "DB_MIGRATION_FAILED",
  "MAX_RETRY_EXCEEDED",
  "INTERNAL_ERROR",
] as const;

export type FactoryErrorCode = (typeof factoryErrorCodes)[number];

export interface FactoryError {
  code: FactoryErrorCode;
  message: string;
  retryable: boolean;
  phase?: string;
  task_id?: string;
  agent_role?: AgentRole;
  cause?: string;
  evidence?: Record<string, string>;
}

const exitCodeByErrorCode: Record<FactoryErrorCode, number> = {
  CONFIG_NOT_FOUND: 1,
  CONFIG_INVALID: 1,
  PROFILE_UNSUPPORTED: 1,
  PROFILE_INVALID: 1,
  USER_APPROVAL_REQUIRED: 2,
  PLAN_REJECTED: 2,
  TASK_GRAPH_INVALID: 1,
  TASK_GRAPH_CYCLE: 3,
  TASK_OUTPUT_MISSING: 4,
  AGENT_COMMAND_FAILED: 4,
  AGENT_TIMEOUT: 4,
  AGENT_REPORT_MISSING: 4,
  REVIEW_HIGH_ISSUES: 5,
  TEST_FAILED: 5,
  STARTUP_HEALTHCHECK_FAILED: 6,
  PORT_UNAVAILABLE: 6,
  DB_MIGRATION_FAILED: 6,
  MAX_RETRY_EXCEEDED: 3,
  INTERNAL_ERROR: 7,
};

export function toExitCode(code: FactoryErrorCode): number {
  return exitCodeByErrorCode[code];
}
