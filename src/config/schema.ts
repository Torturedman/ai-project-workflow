import { z } from "zod";

export const architectureModeSchema = z.enum(["simple", "standard", "microservice"]);
export const runnerSchema = z.enum([
  "mock",
  "codex-cli",
  "claude-code",
  "gemini-cli",
  "openai-api",
  "claude-api",
]);
export const logLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);

const pathsSchema = z.object({
  global_home: z.string().min(1),
  default_output_dir: z.string().min(1),
});

const executionSchema = z.object({
  max_parallel_agents: z.number().int().positive(),
  agent_timeout_seconds: z.number().int().positive(),
  command_timeout_seconds: z.number().int().positive(),
  require_user_approval_before_execution: z.boolean(),
});

const retrySchema = z.object({
  max_fix_rounds: z.number().int().nonnegative(),
  max_same_issue_rounds: z.number().int().nonnegative(),
  max_runner_retries: z.number().int().nonnegative(),
});

const loggingSchema = z.object({
  level: logLevelSchema,
  retain_project_logs: z.boolean(),
  global_retention_days: z.number().int().positive(),
  max_log_file_mb: z.number().int().positive(),
});

export const factoryConfigSchema = z.object({
  default_profile: z.string().min(1),
  default_runner: runnerSchema,
  architecture_mode: architectureModeSchema,
  paths: pathsSchema,
  execution: executionSchema,
  retry: retrySchema,
  logging: loggingSchema,
  supported_profiles: z.array(z.string().min(1)).nonempty(),
});

// Zod 4 removed the old deepPartial API, so config overrides keep an explicit
// partial schema. When the full config schema changes, update this schema too.
// Version note: https://zod.dev/v4/changelog#drops-deeppartial
export const partialFactoryConfigSchema = z.object({
  default_profile: z.string().min(1).optional(),
  default_runner: runnerSchema.optional(),
  architecture_mode: architectureModeSchema.optional(),
  paths: pathsSchema.partial().optional(),
  execution: executionSchema.partial().optional(),
  retry: retrySchema.partial().optional(),
  logging: loggingSchema.partial().optional(),
  supported_profiles: z.array(z.string().min(1)).nonempty().optional(),
});

export type FactoryConfig = z.infer<typeof factoryConfigSchema>;
export type PartialFactoryConfig = z.infer<typeof partialFactoryConfigSchema>;

export interface FactoryConfigError {
  code: "CONFIG_NOT_FOUND" | "CONFIG_INVALID";
  message: string;
  retryable: false;
  phase: "config";
  cause?: string;
  evidence?: Record<string, string>;
}

export type ConfigLoadResult =
  | {
      ok: true;
      config: FactoryConfig;
      loaded_files: string[];
    }
  | {
      ok: false;
      error: FactoryConfigError;
    };
