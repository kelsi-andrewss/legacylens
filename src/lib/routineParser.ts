/**
 * Utilities for detecting Fortran routine names in plain text.
 *
 * Fortran routine names (as used in LAPACK/BLAS) are typically all-uppercase,
 * 2–8 characters, composed of letters and underscores, often with a data-type
 * prefix (S, D, C, Z) followed by a meaningful stem (e.g. DGEMM, DTRTRS).
 *
 * We use a conservative regex and a false-positive filter to avoid hyperlinking
 * common English words that happen to be all-caps.
 */

const FORTRAN_ROUTINE_PATTERN = /\b([A-Z][A-Z0-9_]{1,})\b/g;

/**
 * Common all-caps words that are NOT Fortran routine names.
 * Includes Fortran keywords, English words, and typical markdown tokens.
 */
const FALSE_POSITIVES = new Set([
  // Fortran keywords
  "IF", "DO", "END", "THEN", "ELSE", "ELSEIF", "ENDIF", "ENDDO",
  "GO", "TO", "GOTO", "CALL", "RETURN", "STOP", "PAUSE",
  "READ", "WRITE", "PRINT", "OPEN", "CLOSE", "FORMAT",
  "INTEGER", "REAL", "DOUBLE", "COMPLEX", "LOGICAL", "CHARACTER",
  "PRECISION", "PARAMETER", "DIMENSION", "COMMON", "EQUIVALENCE",
  "EXTERNAL", "INTRINSIC", "IMPLICIT", "NONE", "DATA",
  "FUNCTION", "SUBROUTINE", "PROGRAM", "MODULE", "USE",
  "CONTAINS", "INTENT", "IN", "OUT", "INOUT",
  // Boolean / logical
  "TRUE", "FALSE", "NOT", "AND", "OR", "XOR",
  // Common English abbreviations / acronyms that appear in prose
  "API", "CPU", "GPU", "IO", "OS", "URL", "HTTP", "HTTPS",
  "LHS", "RHS", "LU", "QR", "SVD",
  // Single-letter tokens (too ambiguous)
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
]);

export interface RoutineSpan {
  /** The detected routine name */
  name: string;
  /** Start index in the original text string */
  start: number;
  /** End index (exclusive) in the original text string */
  end: number;
}

/**
 * Scans `text` and returns spans for every token that looks like a Fortran
 * routine name (uppercase, 2+ chars, letters/digits/underscores) and is not
 * in the false-positive list.
 */
export function detectRoutineSpans(text: string): RoutineSpan[] {
  const spans: RoutineSpan[] = [];
  const re = new RegExp(FORTRAN_ROUTINE_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const name = match[1];
    if (FALSE_POSITIVES.has(name)) continue;
    // Require at least one digit or underscore OR length >= 4 to reduce noise
    const hasDigitOrUnderscore = /[0-9_]/.test(name);
    if (!hasDigitOrUnderscore && name.length < 4) continue;
    spans.push({ name, start: match.index, end: match.index + name.length });
  }

  return spans;
}

/**
 * Returns the unique routine names detected in `text`.
 */
export function parseRoutineNames(text: string): string[] {
  const spans = detectRoutineSpans(text);
  return [...new Set(spans.map((s) => s.name))];
}
