import { NextRequest } from "next/server";
import {
  getAllRoutineIds,
  fetchRoutines,
  ChunkMetadata,
} from "@/lib/pinecone";

export const runtime = "nodejs";

function fisherYatesSample<T>(arr: readonly T[], count: number): T[] {
  const copy = [...arr];
  const n = Math.min(count, copy.length);
  for (let i = copy.length - 1; i > copy.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(copy.length - n);
}

export async function GET(req: NextRequest) {
  try {
    const countParam = req.nextUrl.searchParams.get("count");
    const count = Math.min(Math.max(parseInt(countParam || "2", 10) || 2, 1), 20);

    const allIds = await getAllRoutineIds();
    if (allIds.length === 0) {
      return Response.json({ routines: [] });
    }

    // Over-sample to account for deduplication
    const sampleSize = Math.min(count * 3, allIds.length);
    const sampledIds = fisherYatesSample(allIds, sampleSize);

    const result = await fetchRoutines(sampledIds);

    const seen = new Set<string>();
    const routines: { id: string; metadata: ChunkMetadata }[] = [];

    for (const id of sampledIds) {
      if (routines.length >= count) break;
      const record = result.records[id];
      if (!record?.metadata) continue;
      const metadata = record.metadata as unknown as ChunkMetadata;
      const name = metadata.subroutine_name;
      if (seen.has(name)) continue;
      seen.add(name);
      routines.push({ id, metadata });
    }

    return Response.json({ routines });
  } catch (error) {
    console.error("Error fetching random routines:", error);
    return Response.json(
      { error: "Failed to fetch random routines" },
      { status: 500 }
    );
  }
}
