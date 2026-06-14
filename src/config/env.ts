import type { FactoryConfig, PartialFactoryConfig } from "./schema.js";

export interface ConfigEnvironment {
  [key: string]: string | undefined;
  AI_FACTORY_HOME?: string;
  AI_FACTORY_CONFIG?: string;
  AI_FACTORY_DEFAULT_RUNNER?: string;
  AI_FACTORY_CODEX_BIN?: string;
  AI_FACTORY_CLAUDE_BIN?: string;
  AI_FACTORY_GEMINI_BIN?: string;
  AI_FACTORY_LOG_LEVEL?: string;
}

export function configFromEnv(env: ConfigEnvironment): PartialFactoryConfig {
  const config: PartialFactoryConfig = {};

  if (env.AI_FACTORY_HOME) {
    config.paths = {
      global_home: env.AI_FACTORY_HOME,
    };
  }

  if (env.AI_FACTORY_DEFAULT_RUNNER) {
    config.default_runner = env.AI_FACTORY_DEFAULT_RUNNER as FactoryConfig["default_runner"];
  }

  if (env.AI_FACTORY_LOG_LEVEL) {
    config.logging = {
      level: env.AI_FACTORY_LOG_LEVEL as FactoryConfig["logging"]["level"],
    };
  }

  return config;
}
