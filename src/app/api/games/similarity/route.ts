import { NextRequest } from "next/server";
import {
  getCosineSimilarity,
  fetchRoutines,
  ChunkMetadata,
} from "@/lib/pinecone";
import { validateRoutineId } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { idA, idB } = body;

  const idAResult = validateRoutineId(idA);
  if (!idAResult.valid) {
    return Response.json(
      { error: `idA: ${idAResult.error}` },
      { status: 400 }
    );
  }

  const idBResult = validateRoutineId(idB);
  if (!idBResult.valid) {
    return Response.json(
      { error: `idB: ${idBResult.error}` },
      { status: 400 }
    );
  }

  try {
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
  } catch (error) {
    console.error("Similarity calculation failed:", error);
    return Response.json(
      { error: "Failed to calculate similarity" },
      { status: 500 }
    );
  }
}
