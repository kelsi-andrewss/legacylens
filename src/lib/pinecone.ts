import { Pinecone } from "@pinecone-database/pinecone";
import { DEFAULT_TOP_K, PINECONE_INDEX_NAME } from "@/lib/config";

let client: Pinecone | null = null;
let _index: ReturnType<Pinecone["index"]> | null = null;

function getIndex() {
  if (!_index) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    _index = client.index(process.env.PINECONE_INDEX || PINECONE_INDEX_NAME);
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
  topK: number = DEFAULT_TOP_K,
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

const EMBEDDING_DIM = 1536;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedSample: { ids: string[]; timestamp: number } | null = null;

function generateRandomVector(dim: number): number[] {
  const raw = Array.from({ length: dim }, () => Math.random() * 2 - 1);
  const mag = Math.sqrt(raw.reduce((sum, v) => sum + v * v, 0));
  return raw.map((v) => v / mag);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getRandomRoutineIds(count: number): Promise<string[]> {
  if (cachedSample && Date.now() - cachedSample.timestamp < CACHE_TTL_MS) {
    return shuffle(cachedSample.ids).slice(0, count);
  }

  const vector = generateRandomVector(EMBEDDING_DIM);
  const matches = await getIndex().query({
    vector,
    topK: count,
    includeMetadata: false,
  });

  const ids = (matches.matches || []).map((m) => m.id);
  cachedSample = { ids, timestamp: Date.now() };
  return ids;
}

/** @deprecated Use getRandomRoutineIds(count) directly. */
export async function getAllRoutineIds(): Promise<string[]> {
  return getRandomRoutineIds(100);
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
