import type { FactoryError } from "./errors.js";

export interface ApiResponse<TData = unknown> {
  ok: boolean;
  code: string;
  message: string;
  run_id?: string;
  project_id?: string;
  data?: TData;
  warnings?: string[];
  retryable?: boolean;
  details?: Record<string, unknown>;
  evidence?: Record<string, string>;
}

export function toApiResponse(error: FactoryError): ApiResponse;
export function toApiResponse<TData>(
  data: TData,
  warnings: string[] = [],
): ApiResponse<TData> {
  if (isFactoryError(data)) {
    return {
      ok: false,
      code: data.code,
      message: data.message,
      retryable: data.retryable,
      evidence: data.evidence,
    };
  }

  return {
    ok: true,
    code: "OK",
    message: "OK",
    data,
    warnings,
  };
}

function isFactoryError(value: unknown): value is FactoryError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "retryable" in value
  );
}
