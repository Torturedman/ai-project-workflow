import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { ZodError } from "zod";
import { defaultConfig } from "./default-config.js";
import { getDefaultGlobalHome } from "./resource-paths.js";
import type { FactoryErrorCode } from "../domain/errors.js";
import { configFromEnv, type ConfigEnvironment } from "./env.js";
import {
  factoryConfigSchema,
  partialFactoryConfigSchema,
  type ConfigLoadResult,
  type FactoryConfig,
  type PartialFactoryConfig,
} from "./schema.js";

export interface LoadConfigOptions {
  projectDir: string;
  env?: ConfigEnvironment;
  cliOptions?: PartialFactoryConfig;
  globalConfigPath?: string;
}

function configError(
  code: Extract<FactoryErrorCode, "CONFIG_NOT_FOUND" | "CONFIG_INVALID">,
  message: string,
  evidence?: Record<string, string>,
  cause?: string,
): ConfigLoadResult {
  return {
    ok: false,
    error: {
      code,
      message,
      retryable: false,
      phase: "config",
      evidence,
      cause,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeConfig<T extends PartialFactoryConfig>(base: T, override: PartialFactoryConfig): T {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = merged[key];
    if (isRecord(baseValue) && isRecord(overrideValue)) {
      merged[key] = mergeConfig(baseValue as PartialFactoryConfig, overrideValue as PartialFactoryConfig);
      continue;
    }

    merged[key] = overrideValue;
  }

  return merged as T;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readConfigFile(path: string): Promise<ConfigLoadResult | PartialFactoryConfig> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = parse(raw) as unknown;
    const normalized = parsed === null ? {} : parsed;
    const result = partialFactoryConfigSchema.safeParse(normalized);

    if (!result.success) {
      return configError(
        "CONFIG_INVALID",
        "Configuration file failed schema validation",
        { config_file: path },
        result.error.message,
      );
    }

    return result.data;
  } catch (error) {
    return configError(
      "CONFIG_INVALID",
      "Configuration file could not be parsed",
      { config_file: path },
      error instanceof Error ? error.message : String(error),
    );
  }
}

function defaultGlobalConfigPath(env: ConfigEnvironment): string {
  if (env.AI_FACTORY_CONFIG) {
    return env.AI_FACTORY_CONFIG;
  }

  if (env.AI_FACTORY_HOME) {
    return join(env.AI_FACTORY_HOME, "config.yaml");
  }

  return join(getDefaultGlobalHome(), "config.yaml");
}

function isConfigResult(value: ConfigLoadResult | PartialFactoryConfig): value is ConfigLoadResult {
  return "ok" in value;
}

export async function loadConfig(options: LoadConfigOptions): Promise<ConfigLoadResult> {
  const env = options.env ?? process.env;
  const globalConfigPath = options.globalConfigPath ?? defaultGlobalConfigPath(env);
  const projectConfigPath = join(options.projectDir, "ai-factory.config.yaml");
  const loadedFiles: string[] = [];

  // Merge order is the configuration contract: defaults < global < project
  // < environment < CLI. Reordering changes user-visible precedence.
  let config: PartialFactoryConfig = { ...defaultConfig };

  const shouldRequireGlobal = Boolean(options.globalConfigPath || env.AI_FACTORY_CONFIG);
  const globalExists = await fileExists(globalConfigPath);
  if (globalExists) {
    const globalConfig = await readConfigFile(globalConfigPath);
    if (isConfigResult(globalConfig)) {
      return globalConfig;
    }
    config = mergeConfig(config, globalConfig);
    loadedFiles.push(globalConfigPath);
  } else if (shouldRequireGlobal) {
    return configError("CONFIG_NOT_FOUND", "Explicit global configuration file was not found", {
      config_file: globalConfigPath,
    });
  }

  if (await fileExists(projectConfigPath)) {
    const projectConfig = await readConfigFile(projectConfigPath);
    if (isConfigResult(projectConfig)) {
      return projectConfig;
    }
    config = mergeConfig(config, projectConfig);
    loadedFiles.push(projectConfigPath);
  }

  config = mergeConfig(config, configFromEnv(env));
  config = mergeConfig(config, options.cliOptions ?? {});

  const result = factoryConfigSchema.safeParse(config);
  if (!result.success) {
    return configError("CONFIG_INVALID", "Merged configuration failed schema validation", undefined, formatZodError(result.error));
  }

  return {
    ok: true,
    config: result.data as FactoryConfig,
    loaded_files: loadedFiles,
  };
}

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}
