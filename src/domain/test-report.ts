import type { FactoryError } from "./errors.js";

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
