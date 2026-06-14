import { describe, expect, it } from "vitest";
import { toApiResponse } from "../../src/domain/api-response.js";
import { factoryErrorCodes, toExitCode } from "../../src/domain/errors.js";

describe("domain errors", () => {
  it("maps each FactoryErrorCode to an exit code", () => {
    expect(factoryErrorCodes.map((code) => [code, toExitCode(code)])).toEqual([
      ["CONFIG_NOT_FOUND", 1],
      ["CONFIG_INVALID", 1],
      ["PROFILE_UNSUPPORTED", 1],
      ["PROFILE_INVALID", 1],
      ["USER_APPROVAL_REQUIRED", 2],
      ["PLAN_REJECTED", 2],
      ["TASK_GRAPH_INVALID", 1],
      ["TASK_GRAPH_CYCLE", 3],
      ["TASK_OUTPUT_MISSING", 4],
      ["AGENT_COMMAND_FAILED", 4],
      ["AGENT_TIMEOUT", 4],
      ["AGENT_REPORT_MISSING", 4],
      ["REVIEW_HIGH_ISSUES", 5],
      ["TEST_FAILED", 5],
      ["STARTUP_HEALTHCHECK_FAILED", 6],
      ["PORT_UNAVAILABLE", 6],
      ["DB_MIGRATION_FAILED", 6],
      ["MAX_RETRY_EXCEEDED", 3],
      ["INTERNAL_ERROR", 7],
    ]);
  });

  it("wraps a factory error in the ApiResponse shape", () => {
    expect(
      toApiResponse({
        code: "CONFIG_INVALID",
        message: "invalid config",
        retryable: false,
        evidence: { config_file: "ai-factory.config.yaml" },
      }),
    ).toEqual({
      ok: false,
      code: "CONFIG_INVALID",
      message: "invalid config",
      retryable: false,
      evidence: { config_file: "ai-factory.config.yaml" },
    });
  });
});
