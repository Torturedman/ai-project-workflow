const redactedText = "[REDACTED]";

// These patterns target the concrete sensitive formats called out in security.md:
// headers, API keys, bearer/JWT tokens, cloud tokens, and database URL secrets.
const sensitiveHeaderPattern = /^(Authorization|Cookie)\s*:\s*.+$/gim;
const bearerTokenPattern = /\bBearer\s+([A-Za-z0-9._~+/=-]+)\b/gi;
const openAiKeyPattern = /(OPENAI_API_KEY\s*=\s*)([^ \t\r\n]+)/gi;
const anthropicKeyPattern = /(ANTHROPIC_API_KEY\s*=\s*)([^ \t\r\n]+)/gi;
const databasePasswordPattern = /\b([a-z][a-z0-9+.-]*:\/\/[^:\s/]+:)([^@\s/]+)(@)/gi;
const jwtPattern = /\beyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+\.[A-Za-z0-9._-]+\b/g;
const awsAccessKeyPattern = /\bAKIA[0-9A-Z]{16}\b/g;
const githubTokenPattern = /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g;
const headerValuePattern = /:\s*.+$/;

export function redactText(value: string): string {
  return value
    .replace(sensitiveHeaderPattern, (match) => match.replace(headerValuePattern, `: ${redactedText}`))
    .replace(bearerTokenPattern, `Bearer ${redactedText}`)
    .replace(openAiKeyPattern, (_match, prefix: string) => `${prefix}${redactedText}`)
    .replace(anthropicKeyPattern, (_match, prefix: string) => `${prefix}${redactedText}`)
    .replace(databasePasswordPattern, (_match, prefix: string, _password: string, suffix: string) => `${prefix}${redactedText}${suffix}`)
    .replace(jwtPattern, redactedText)
    .replace(awsAccessKeyPattern, redactedText)
    .replace(githubTokenPattern, redactedText)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function redactValue<TValue>(value: TValue): TValue {
  if (typeof value === "string") {
    return redactText(value) as TValue;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item)) as TValue;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (
      key === "OPENAI_API_KEY" ||
      key === "ANTHROPIC_API_KEY" ||
      key === "Authorization" ||
      key === "Cookie" ||
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("password")
    ) {
      redacted[key] = redactedText;
      continue;
    }

    if (key === "DATABASE_URL") {
      redacted[key] = typeof entry === "string" ? redactText(entry) : redactValue(entry);
      continue;
    }

    redacted[key] = redactValue(entry);
  }

  return redacted as TValue;
}
