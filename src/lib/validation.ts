import { MAX_QUERY_LENGTH } from "@/lib/config";
import { QueryMode } from "@/lib/prompts";

const VALID_MODES: readonly string[] = [
  "explain",
  "dependencies",
  "docs",
  "translate",
] satisfies readonly QueryMode[];

/**
 * Strip HTML tags and trim whitespace.
 * Uses a simple regex — sufficient for preventing reflected XSS in plain-text fields.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim();
}

export function validateQuery(query: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof query !== "string") {
    return { valid: false, error: "query must be a string" };
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "query must not be empty" };
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `query must not exceed ${MAX_QUERY_LENGTH} characters`,
    };
  }
  return { valid: true };
}

export function validateMode(mode: unknown): {
  valid: boolean;
  error?: string;
} {
  if (mode === undefined || mode === null) {
    return { valid: true }; // optional — defaults handled by caller
  }
  if (typeof mode !== "string" || !VALID_MODES.includes(mode)) {
    return {
      valid: false,
      error: `mode must be one of: ${VALID_MODES.join(", ")}`,
    };
  }
  return { valid: true };
}

export function validateRoutineId(id: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof id !== "string" || id.trim().length === 0) {
    return { valid: false, error: "routine ID must be a non-empty string" };
  }
  return { valid: true };
}

/**
 * Parse a count query param into an integer clamped to [1, 20].
 * Returns defaultVal on null/undefined/NaN.
 */
export function validateCount(
  value: string | null,
  defaultVal: number = 2
): number {
  if (value === null || value === undefined) return defaultVal;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return defaultVal;
  return Math.min(Math.max(parsed, 1), 20);
}
