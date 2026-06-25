const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

function sanitizeErrorText(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return "";

  cleaned = cleaned.replace(/^Error:\s*\d{3}\s*/i, "");
  cleaned = cleaned.replace(/^Error:\s*/i, "");

  const jsonStart = cleaned.indexOf("{");
  if (jsonStart !== -1) {
    const jsonPart = cleaned.slice(jsonStart);
    try {
      const parsed = JSON.parse(jsonPart);
      const nested = extractErrorMessage(parsed, "");
      if (nested) return nested;
    } catch {
      // keep cleaned text below
    }
  }

  return cleaned;
}

export function extractErrorMessage(
  input: unknown,
  fallback = DEFAULT_MESSAGE,
): string {
  if (input == null) return fallback;

  if (input instanceof Error) {
    const message = sanitizeErrorText(input.message);
    return message || fallback;
  }

  if (typeof input === "string") {
    const message = sanitizeErrorText(input);
    return message || fallback;
  }

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;

    if ("error" in obj) {
      const nested = extractErrorMessage(obj.error, "");
      if (nested) return nested;
    }

    if ("message" in obj && typeof obj.message === "string") {
      const message = sanitizeErrorText(obj.message);
      if (message) return message;
    }
  }

  return fallback;
}
