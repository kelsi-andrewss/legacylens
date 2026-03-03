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
