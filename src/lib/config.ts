// Centralized configuration for LLM and vector search parameters.
// Change values here to tune behavior across all search and game features.

export const CHAT_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const TEMPERATURE = 0.3;
export const MAX_TOKENS = 2000;
export const DEFAULT_TOP_K = 5;
export const PINECONE_INDEX_NAME = "legacylens";
export const MAX_QUERY_LENGTH = 1000;
export const GRAPH_EXPANSION_DEPTH = 1; // max depth for dependency traversal
export const GRAPH_EXPANSION_MAX_CHUNKS = DEFAULT_TOP_K * 3; // total context cap
