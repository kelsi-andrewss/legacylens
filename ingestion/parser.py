"""Fortran source parser for LAPACK/BLAS code."""

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class FortranRoutine:
    name: str
    kind: str  # SUBROUTINE, FUNCTION, PROGRAM
    parameters: list[str]
    file_path: str
    line_start: int
    line_end: int
    source: str
    comment_block: str
    dependencies: list[str] = field(default_factory=list)
    data_type_prefix: str = ""  # S, D, C, Z
    category: str = ""  # BLAS, LAPACK
    invariants: str = ""
    constraints: str = ""
    error_codes: str = ""


# Match SUBROUTINE/FUNCTION/PROGRAM declarations in Fortran fixed-format
# Column 1-5: label, Column 6: continuation, Column 7-72: statement
ROUTINE_START = re.compile(
    r"^\s{6,}\s*(?:(?:INTEGER|REAL|DOUBLE\s+PRECISION|COMPLEX|LOGICAL|CHARACTER)\s+)?(?:RECURSIVE\s+)?"
    r"(SUBROUTINE|FUNCTION|PROGRAM)\s+(\w+)\s*(\(([^)]*)\))?",
    re.IGNORECASE | re.MULTILINE,
)

CALL_PATTERN = re.compile(r"\bCALL\s+(\w+)", re.IGNORECASE)
END_PATTERN = re.compile(r"^\s{6,}\s*END\s*(?:SUBROUTINE|FUNCTION|PROGRAM)?\s*(\w*)", re.IGNORECASE)


def infer_data_type_prefix(name: str) -> str:
    """Infer S/D/C/Z prefix from routine name."""
    if len(name) >= 2 and name[0].upper() in ("S", "D", "C", "Z"):
        return name[0].upper()
    return ""


def infer_category(file_path: str) -> str:
    """Infer BLAS vs LAPACK from file path."""
    path_lower = file_path.lower()
    if "blas" in path_lower:
        return "BLAS"
    return "LAPACK"


def extract_invariants(comment_block: str) -> dict:
    """Extract structured invariants from a normalized Fortran comment block.

    Returns a dict with keys ``invariants``, ``constraints``, ``error_codes``.
    All values default to "" if the corresponding section is absent or on any
    parse error.  The comment_block is already stripped of C/c/*/! prefixes by
    extract_comment_block, so no comment-style handling is needed here.
    """
    try:
        lines = comment_block.splitlines()

        # --- Section boundary detection ---
        # Patterns that delimit well-known LAPACK comment sections.
        PURPOSE_RE = re.compile(r"^\s*(?:Purpose|Purpose\s*:?)\s*$", re.IGNORECASE)
        FURTHER_RE = re.compile(r"^\s*Further\s+Details\s*:?\s*$", re.IGNORECASE)
        ARGS_RE = re.compile(r"^\s*Arguments\s*:?\s*$", re.IGNORECASE)
        INFO_RE = re.compile(r"^\s*(?:INFO|Error\s+Info|Error)\s*", re.IGNORECASE)
        SEPARATOR_RE = re.compile(r"^[=\-]+$")
        INTENT_RE = re.compile(
            r"\b(INPUT|OUTPUT|INOUT|intent\s*\(\s*in\s*\)|intent\s*\(\s*out\s*\)|"
            r"intent\s*\(\s*inout\s*\)|\(input\)|\(output\)|\(in\/out\)|\(in,out\))\b",
            re.IGNORECASE,
        )

        # Collect invariants: Purpose section + opening description paragraph
        invariant_lines: list[str] = []
        constraint_lines: list[str] = []
        error_lines: list[str] = []

        i = 0
        n = len(lines)

        # Grab opening description paragraph (lines before any known section header)
        # and explicit Purpose / Further Details sections.
        in_purpose = False
        in_args = False
        in_info = False

        while i < n:
            line = lines[i]
            stripped = line.strip()

            if PURPOSE_RE.match(stripped) or FURTHER_RE.match(stripped):
                in_purpose = True
                in_args = False
                in_info = False
                i += 1
                continue

            if ARGS_RE.match(stripped):
                in_args = True
                in_purpose = False
                in_info = False
                i += 1
                continue

            if INFO_RE.match(stripped):
                in_info = True
                in_purpose = False
                in_args = False
                # Include the trigger line itself — it often contains the description.
                error_lines.append(stripped)
                i += 1
                continue

            if in_purpose:
                if not SEPARATOR_RE.match(stripped):
                    invariant_lines.append(stripped)
            elif in_args:
                # Capture lines that describe argument intent.
                if INTENT_RE.search(line):
                    constraint_lines.append(stripped)
            elif in_info:
                if stripped:
                    error_lines.append(stripped)

            i += 1

        # If no explicit Purpose section was found, treat the first non-empty
        # paragraph (before any section header) as the invariant description.
        if not invariant_lines:
            for line in lines:
                s = line.strip()
                if PURPOSE_RE.match(s) or ARGS_RE.match(s) or INFO_RE.match(s):
                    break
                if s:
                    invariant_lines.append(s)

        return {
            "invariants": "\n".join(invariant_lines).strip(),
            "constraints": "\n".join(constraint_lines).strip(),
            "error_codes": "\n".join(error_lines).strip(),
        }
    except Exception:
        return {"invariants": "", "constraints": "", "error_codes": ""}


def extract_comment_block(lines: list[str], start_idx: int) -> str:
    """Extract comment block immediately preceding a routine declaration."""
    comments = []
    idx = start_idx - 1
    while idx >= 0:
        line = lines[idx]
        # Fortran comment: C, c, *, or ! in column 1
        if line and line[0] in ("C", "c", "*", "!"):
            comments.append(line[1:].strip() if len(line) > 1 else "")
        elif line.strip() == "":
            comments.append("")
        else:
            break
        idx -= 1
    comments.reverse()
    # Trim leading/trailing blank lines
    while comments and not comments[0]:
        comments.pop(0)
    while comments and not comments[-1]:
        comments.pop()
    return "\n".join(comments)


def parse_file(file_path: Path) -> list[FortranRoutine]:
    """Parse a Fortran source file and extract all routines."""
    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []

    lines = content.split("\n")
    routines = []

    # Find all routine starts
    routine_starts = []
    for i, line in enumerate(lines):
        match = ROUTINE_START.match(line)
        if match:
            kind = match.group(1).upper()
            name = match.group(2).upper()
            params_str = match.group(4) or ""
            params = [p.strip() for p in params_str.split(",") if p.strip()]
            routine_starts.append((i, kind, name, params))

    # Find routine boundaries and extract
    for idx, (start_line, kind, name, params) in enumerate(routine_starts):
        # Find end: either next routine start or END statement
        end_line = len(lines) - 1

        # Search for matching END
        for i in range(start_line + 1, len(lines)):
            end_match = END_PATTERN.match(lines[i])
            if end_match:
                end_name = end_match.group(1).upper() if end_match.group(1) else ""
                if end_name == "" or end_name == name:
                    end_line = i
                    break
            # If we hit the next routine start, stop before it
            if idx + 1 < len(routine_starts) and i == routine_starts[idx + 1][0]:
                end_line = i - 1
                break

        source = "\n".join(lines[start_line : end_line + 1])

        # Extract CALL dependencies
        deps = list(set(CALL_PATTERN.findall(source)))
        deps = [d.upper() for d in deps]

        comment_block = extract_comment_block(lines, start_line)
        file_str = str(file_path)
        inv = extract_invariants(comment_block)

        routines.append(
            FortranRoutine(
                name=name,
                kind=kind,
                parameters=params,
                file_path=file_str,
                line_start=start_line + 1,  # 1-indexed
                line_end=end_line + 1,
                source=source,
                comment_block=comment_block,
                dependencies=deps,
                data_type_prefix=infer_data_type_prefix(name),
                category=infer_category(file_str),
                invariants=inv["invariants"],
                constraints=inv["constraints"],
                error_codes=inv["error_codes"],
            )
        )

    return routines


def discover_files(base_path: Path) -> list[Path]:
    """Discover all .f and .f90 Fortran files in LAPACK source directories."""
    files = []
    # Target directories within the LAPACK repo
    target_dirs = ["SRC", "BLAS/SRC", "INSTALL"]
    for target in target_dirs:
        target_path = base_path / target
        if target_path.exists():
            files.extend(target_path.rglob("*.f"))
            files.extend(target_path.rglob("*.f90"))
    return sorted(files)
