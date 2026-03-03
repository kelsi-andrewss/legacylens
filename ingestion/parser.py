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
