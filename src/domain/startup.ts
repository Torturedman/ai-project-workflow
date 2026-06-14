import type { VerificationStatus } from "./test-report.js";

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
