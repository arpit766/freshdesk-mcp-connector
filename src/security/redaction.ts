const SENSITIVE_KEY_PATTERN =
  /(api[_-]?key|authorization|password|secret|token|cookie|set-cookie)/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export function redactString(value: string, maxLen = 500): string {
  let out = value.slice(0, maxLen);
  out = out.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
  out = out.replace(PHONE_PATTERN, '[REDACTED_PHONE]');
  return out;
}

export function redactForLogs(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactForLogs(v));
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactForLogs(val);
      }
    }
    return result;
  }
  return value;
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(headers)) {
    out[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : val;
  }
  return out;
}
