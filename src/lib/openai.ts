import OpenAI from "openai";
import { EMBEDDING_MODEL } from "@/lib/config";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return client;
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  if (!response.data?.[0]?.embedding) {
    throw new Error("OpenAI embeddings API returned empty data");
  }
  return response.data[0].embedding;
}
