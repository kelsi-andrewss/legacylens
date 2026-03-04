import OpenAI from "openai";
import { EMBEDDING_MODEL, CHAT_MODEL } from "@/lib/config";

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

export async function generateHypotheticalDocument(query: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a LAPACK/BLAS technical reference. Given a question about numerical linear algebra, write a 2-3 sentence description of what a relevant Fortran subroutine would do, including its purpose, key parameters, and what it computes. Write only the description — no preamble, no code."
      },
      { role: "user", content: query }
    ],
    temperature: 0,
    max_tokens: 150,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}
