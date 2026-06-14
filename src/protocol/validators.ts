import { z, type ZodError, type ZodType } from "zod";
import type { FactoryError, FactoryErrorCode } from "../domain/errors.js";
import type { ProjectState } from "../domain/project.js";
import type { TaskGraph } from "../domain/task-graph.js";
import { readJsonFile, writeJsonFileAtomic } from "../persistence/file-store.js";

const projectStatusSchema = z.enum([
  "intake",
  "planning",
  "researching",
  "deciding",
  "awaiting_user_approval",
  "executing",
  "integrating",
  "testing",
  "fixing",
  "accepting",
  "completed",
  "blocked",
]);

const taskStatusSchema = z.enum([
  "pending",
  "ready",
  "running",
  "ready_for_review",
  "reviewing",
  "changes_requested",
  "fixing",
  "approved",
  "integrated",
  "testing",
  "failed",
  "tested",
  "accepted",
  "blocked",
]);

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

export const projectStateSchema = z.object({
  version: z.literal("1.0"),
  project_id: z.string().min(1),
  run_id: z.string().min(1),
  status: projectStatusSchema,
  raw_request: z.string(),
  selected_profile: z.string().min(1),
  architecture_mode: z.string().min(1),
  approval: z.object({
    required: z.boolean(),
    approved: z.boolean(),
    approved_at: z.string().nullable(),
  }),
  current_phase: z.string().min(1),
  frontend_url: z.string().nullable(),
  backend_url: z.string().nullable(),
  api_docs_url: z.string().nullable(),
  last_error: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const taskGraphSchema = z.object({
  version: z.literal("1.0"),
  project_id: z.string().min(1),
  run_id: z.string().min(1),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      owner: agentRoleSchema,
      status: taskStatusSchema,
      depends_on: z.array(z.string()),
      stack_profile: z.string().min(1),
      workspace: z.string().min(1),
      inputs: z.array(z.string()),
      outputs: z.array(z.string()),
      allowed_paths: z.array(z.string()),
      verification_commands: z.array(z.string()),
      attempt: z.number().int().nonnegative(),
      max_attempts: z.number().int().positive(),
    }),
  ),
});

function validationError(code: FactoryErrorCode, path: string, error: ZodError): FactoryError {
  return {
    code,
    message: "Protocol file failed schema validation",
    retryable: false,
    phase: "protocol",
    cause: error.message,
    evidence: {
      file: path,
    },
  };
}

async function readValidatedJson<TData>(
  path: string,
  schema: ZodType<TData>,
  errorCode: FactoryErrorCode,
): Promise<TData> {
  const data = await readJsonFile(path);
  const result = schema.safeParse(data);

  if (!result.success) {
    throw validationError(errorCode, path, result.error);
  }

  return result.data;
}

async function writeValidatedJson<TData>(
  path: string,
  data: TData,
  schema: ZodType<TData>,
  errorCode: FactoryErrorCode,
): Promise<void> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw validationError(errorCode, path, result.error);
  }

  await writeJsonFileAtomic(path, result.data);
}

export function readStatusFile(path: string): Promise<ProjectState> {
  return readValidatedJson(path, projectStateSchema, "CONFIG_INVALID");
}

export function writeStatusFile(path: string, data: ProjectState): Promise<void> {
  return writeValidatedJson(path, data, projectStateSchema, "CONFIG_INVALID");
}

export function readTaskGraphFile(path: string): Promise<TaskGraph> {
  return readValidatedJson(path, taskGraphSchema, "TASK_GRAPH_INVALID");
}

export function writeTaskGraphFile(path: string, data: TaskGraph): Promise<void> {
  return writeValidatedJson(path, data, taskGraphSchema, "TASK_GRAPH_INVALID");
}
