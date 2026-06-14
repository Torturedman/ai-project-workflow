import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { FactoryError } from "../domain/errors.js";
import { writeJsonFileAtomic } from "../persistence/file-store.js";

const reportStatusSchema = z.enum(["completed", "failed", "blocked"]);
const agentRoleSchema = z.enum([
  "intake",
  "planner",
  "research",
  "judge",
  "architect",
  "task-graph",
  "dev-backend",
  "dev-frontend",
  "dev-db",
  "review",
  "test-qa",
]);

export const agentReportSchema = z.object({
  version: z.literal("1.0"),
  run_id: z.string().min(1),
  task_id: z.string().min(1),
  role: agentRoleSchema,
  status: reportStatusSchema,
  summary: z.string(),
  changed_files: z.array(z.string()),
  created_files: z.array(z.string()),
  verification: z.array(
    z.object({
      command: z.string().min(1),
      status: z.enum(["passed", "failed", "skipped"]),
      log: z.string().min(1),
    }),
  ),
  risks: z.array(z.string()),
  next_actions: z.array(z.string()),
});

export type AgentReportJson = z.infer<typeof agentReportSchema>;

export interface AgentReportWriteRequest {
  json: AgentReportJson;
  markdown: string;
}

export async function writeAgentReport(
  factoryDir: string,
  role: AgentReportJson["role"],
  report: AgentReportWriteRequest,
): Promise<void> {
  const result = agentReportSchema.safeParse(report.json);

  if (!result.success) {
    const error: FactoryError = {
      code: "CONFIG_INVALID",
      message: "Agent report failed schema validation",
      retryable: false,
      phase: "protocol",
      cause: result.error.message,
      evidence: {
        role,
      },
    };
    throw error;
  }

  const agentDir = join(factoryDir, "agents", role);
  await mkdir(agentDir, { recursive: true });
  await writeJsonFileAtomic(join(agentDir, "report.json"), result.data);
  await writeFile(join(agentDir, "report.md"), report.markdown, "utf8");
}
