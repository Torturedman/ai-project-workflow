export interface ApiResponse<TData = unknown> {
  ok: boolean;
  code: string;
  message: string;
  data?: TData;
  warnings?: string[];
}

export function toApiResponse<TData>(
  data: TData,
  warnings: string[] = [],
): ApiResponse<TData> {
  return {
    ok: true,
    code: "OK",
    message: "OK",
    data,
    warnings,
  };
}
