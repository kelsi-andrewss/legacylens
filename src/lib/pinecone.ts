import { Pinecone } from "@pinecone-database/pinecone";

let client: Pinecone | null = null;
let _index: ReturnType<Pinecone["index"]> | null = null;

function getIndex() {
  if (!_index) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    _index = client.index(process.env.PINECONE_INDEX || "legacylens");
  }
  return _index;
}

export interface ChunkMetadata {
  subroutine_name: string;
  kind: string;
  file_path: string;
  line_start: number;
  line_end: number;
  parameters: string;
  dependencies: string;
  data_type_prefix: string;
  category: string;
  text: string;
}

export async function queryPinecone(
  embedding: number[],
  topK: number = 5,
  filter?: Record<string, unknown>
) {
  const results = await getIndex().query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: filter || undefined,
  });
  return results.matches || [];
}

let cachedIds: string[] | null = null;

export async function getAllRoutineIds(): Promise<string[]> {
  if (cachedIds) return cachedIds;
  const index = getIndex();
  const ids: string[] = [];
  let paginationToken: string | undefined;
  do {
    const page = await index.listPaginated({ limit: 100, paginationToken });
    if (page.vectors) {
      for (const v of page.vectors) {
        if (v.id) ids.push(v.id);
      }
    }
    paginationToken = page.pagination?.next;
  } while (paginationToken);
  cachedIds = ids;
  return ids;
}

export async function fetchRoutines(ids: string[]) {
  const index = getIndex();
  return index.fetch({ ids });
}

export async function getCosineSimilarity(idA: string, idB: string): Promise<number> {
  const index = getIndex();
  const result = await index.fetch({ ids: [idA, idB] });
  const vecA = result.records[idA]?.values;
  const vecB = result.records[idB]?.values;
  if (!vecA || !vecB) throw new Error("Could not fetch vectors");
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
