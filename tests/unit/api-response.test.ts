import { describe, expect, it } from "vitest";
import { toApiResponse } from "../../src/domain/api-response.js";

describe("toApiResponse", () => {
  it("wraps successful data in the machine readable response shape", () => {
    expect(toApiResponse({ status: "ready" })).toEqual({
      ok: true,
      code: "OK",
      message: "OK",
      data: { status: "ready" },
      warnings: [],
    });
  });
});
