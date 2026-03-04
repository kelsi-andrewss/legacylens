import { NextRequest } from "next/server";
import {
  getCosineSimilarity,
  fetchRoutines,
  ChunkMetadata,
} from "@/lib/pinecone";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { idA, idB } = body;

  if (!idA || !idB) {
    return Response.json(
      { error: "Both idA and idB are required" },
      { status: 400 }
    );
  }

  const [score, fetched] = await Promise.all([
    getCosineSimilarity(idA, idB),
    fetchRoutines([idA, idB]),
  ]);

  const nameA =
    (fetched.records[idA]?.metadata as unknown as ChunkMetadata)
      ?.subroutine_name ?? idA;
  const nameB =
    (fetched.records[idB]?.metadata as unknown as ChunkMetadata)
      ?.subroutine_name ?? idB;

  return Response.json({
    score,
    percentage: Math.round(score * 100),
    nameA,
    nameB,
  });
}
