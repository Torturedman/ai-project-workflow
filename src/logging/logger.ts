import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import pino from "pino";
import { redactText, redactValue } from "./redact.js";

export interface JsonlLogger {
  info(event: string, message: string, data?: unknown): void;
  warn(event: string, message: string, data?: unknown): void;
  error(event: string, message: string, data?: unknown): void;
  flush(): void;
}

export interface JsonlLoggerOptions {
  logFile: string;
  level?: pino.LevelWithSilentOrString;
}

export async function createJsonlLogger(options: JsonlLoggerOptions): Promise<JsonlLogger> {
  await mkdir(dirname(options.logFile), { recursive: true });
  const stream = pino.destination({ dest: options.logFile, sync: true });
  const logger = pino(
    {
      level: options.level ?? "info",
      formatters: {
        level(label) {
          return { level: label };
        },
      },
      messageKey: "message",
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    stream,
  );

  return {
    info(event, message, data) {
      logger.info({ event, ...redactValue(data ?? {}) }, redactText(message));
    },
    warn(event, message, data) {
      logger.warn({ event, ...redactValue(data ?? {}) }, redactText(message));
    },
    error(event, message, data) {
      logger.error({ event, ...redactValue(data ?? {}) }, redactText(message));
    },
    flush() {
      logger.flush();
    },
  };
}
