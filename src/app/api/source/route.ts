import { NextRequest } from "next/server";

export const runtime = "nodejs";

const ALLOWED_PREFIXES = ["SRC/", "BLAS/SRC/", "INSTALL/"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return Response.json({ error: "Missing path parameter" }, { status: 400 });
  }

  if (path.includes("..")) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  const allowed = ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!allowed) {
    return Response.json({ error: "Path not in allowed directories" }, { status: 400 });
  }

  const githubUrl = `https://raw.githubusercontent.com/Reference-LAPACK/lapack/master/${path}`;
  const response = await fetch(githubUrl);

  if (!response.ok) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const content = await response.text();
  return Response.json({ content });
}
