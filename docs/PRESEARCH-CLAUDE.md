LegacyLens Pre-Search Document                                                                                                                                                            
                                                                  
  Completed before writing any code. All 16 checklist items across 3 phases.                                                                                                                
                                                                                                                                                                                            
  ---                                                                                                                                                                                       
  Phase 1: Define Your Constraints                                

  1. Scale & Load Profile

  - Target codebase size: LAPACK (Fortran) — 600K+ LOC across ~1,700 files, ~3,500 subroutines
  - Expected query volume: Low during development/demo. MVP targets 10-50 queries/day. Production projection assumes 5 queries/user/day.
  - Batch ingestion or incremental updates: Batch ingestion only. LAPACK is a stable library — no incremental updates needed. Full re-index on demand if chunking strategy changes.
  - Latency requirements: <3 seconds end-to-end per query (matching project performance targets).

  2. Budget & Cost Ceiling

  - Vector database hosting: $0/month — Pinecone free tier (Starter plan: 5 indexes, 2GB storage, 100K read units/month)
  - Embedding API costs: OpenAI text-embedding-3-small at $0.02 per 1M tokens. Full LAPACK ingestion: ~2.4M tokens = ~$0.05 one-time.
  - LLM API costs: GPT-4o-mini — $0.15/1M input tokens, $0.60/1M output tokens. Per query (~3K input + ~500 output): ~$0.00075.
  - Where will you trade money for time: Everywhere. Use managed services (Pinecone, Vercel, OpenAI) to avoid ops overhead. The sprint is 1 week — time is the binding constraint, not cost.

  3. Time to Ship

  - MVP timeline: 24 hours (Tuesday deadline). Basic ingestion + retrieval + query interface + deployment.
  - Must-have vs nice-to-have:
    - Must-have: Ingest LAPACK, chunk by subroutine, embed, store in Pinecone, semantic search, web UI with syntax highlighting, answer generation, deployed on Vercel
    - Nice-to-have: Re-ranking, dependency mapping, code explanation features, caching
  - Framework learning curve acceptable: No. Using custom Python pipeline — no time to learn LangChain abstractions that would add overhead without clear benefit at this scale.

  4. Data Sensitivity

  - Is the codebase open source or proprietary: Open source. LAPACK is a public Netlib project (BSD license).
  - Can you send code to external APIs: Yes — no restrictions on sending open source Fortran to OpenAI or Pinecone.
  - Data residency requirements: None.

  5. Team & Skill Constraints

  - Familiarity with vector databases: Some — have used embeddings before, Pinecone is new but well-documented.
  - Experience with RAG frameworks: Limited. This is the learning objective. Choosing custom pipeline over LangChain to understand internals.
  - Comfort with target legacy language: Low Fortran experience, but LAPACK has extremely well-structured subroutines with consistent naming conventions (DGESV, SGEMM, etc.), making it
  ideal for syntax-aware parsing.

  ---
  Phase 2: Architecture Discovery

  6. Vector Database Selection

  Choice: Pinecone (managed cloud)

  - Managed vs self-hosted: Managed. Zero ops burden in a 1-week sprint. No Docker, no infrastructure provisioning.
  - Filtering and metadata requirements: Yes — need to filter by file path, subroutine name, data type (single/double/complex). Pinecone supports metadata filtering natively.
  - Hybrid search (vector + keyword) needed: Not for MVP. Pure vector similarity is sufficient for subroutine-level code chunks. Could add keyword filtering on metadata later.
  - Scaling characteristics: Free tier handles the full LAPACK corpus easily (~3,500 vectors at 1536 dims < 50MB). Pinecone scales horizontally if needed, but won't be needed here.

  Alternatives considered:

  ┌──────────┬────────────────────────────────────────────────────────────────────┐
  │ Database │                              Why not                               │
  ├──────────┼────────────────────────────────────────────────────────────────────┤
  │ ChromaDB │ Great for prototyping but no managed hosting — would need a server │
  ├──────────┼────────────────────────────────────────────────────────────────────┤
  │ Weaviate │ More complex setup, GraphQL API adds friction                      │
  ├──────────┼────────────────────────────────────────────────────────────────────┤
  │ Qdrant   │ Strong option but self-hosted adds ops burden                      │
  ├──────────┼────────────────────────────────────────────────────────────────────┤
  │ pgvector │ Would need a Postgres instance to manage                           │
  └──────────┴────────────────────────────────────────────────────────────────────┘

  7. Embedding Strategy

  Choice: OpenAI text-embedding-3-small (1536 dimensions)

  - Code-specific vs general-purpose model: General-purpose. text-embedding-3-small handles code well enough for Fortran subroutines, which are heavily commented in English. Voyage Code 2
  is optimized for code but costs more and adds another API dependency.
  - Dimension size tradeoffs: 1536 dims — good balance. 3072 (text-embedding-3-large) doubles storage and query cost with marginal quality gain for this use case. 1024 (Cohere) loses some
  fidelity.
  - Local vs API-based embedding: API-based. Local sentence-transformers would be free but adds Python dependency complexity and is slower without GPU. API cost for full LAPACK is ~$0.05.
  - Batch processing approach: Batch embed in groups of 100 chunks per API call. OpenAI supports batch embedding natively. Total ingestion: ~35 API calls.

  8. Chunking Approach

  Choice: Subroutine/function-level (Fortran natural boundaries)

  - Syntax-aware vs fixed-size: Syntax-aware. Fortran has clear SUBROUTINE/FUNCTION/PROGRAM boundaries delimited by END statements. Regex-based splitting on these boundaries is reliable
  and preserves semantic units.
  - Optimal chunk size for embedding model: Most LAPACK subroutines are 50-300 lines (~200-1200 tokens), well within the 8191 token limit for text-embedding-3-small. Subroutines exceeding
  1500 tokens get a fixed-size fallback with overlap.
  - Overlap strategy: No overlap needed for subroutine-level chunks — each is a self-contained unit. For oversized chunks that require splitting, use 10% overlap (~50 tokens).
  - Metadata to preserve: File path, subroutine name, line numbers (start/end), parameter list, data type prefix (S/D/C/Z for single/double/complex/double-complex), dependencies (CALL
  statements extracted via regex).

  9. Retrieval Pipeline

  - Top-k value for similarity search: k=5 for initial retrieval. Return top 5 most similar chunks to the user.
  - Re-ranking approach: None for MVP. Pinecone's cosine similarity scoring is the ranking. Could add cross-encoder re-ranking as a stretch goal.
  - Context window management: Assemble retrieved chunks into a prompt. 5 chunks * ~800 tokens avg = ~4000 tokens of context, well within GPT-4o-mini's 128K context window. Include
  metadata (file path, line numbers) inline with each chunk.
  - Multi-query or query expansion: Not for MVP. Single query embedding, single Pinecone search. Query expansion (e.g., "what does DGESV do" -> also search "linear solve") is a stretch
  goal.

  10. Answer Generation

  Choice: GPT-4o-mini

  - Which LLM for synthesis: GPT-4o-mini. Excellent cost/quality ratio ($0.15/$0.60 per M tokens). Fast responses (~1-2s). Sufficient reasoning for code explanation tasks. GPT-4o would be
  overkill and 10x more expensive.
  - Prompt template design: System prompt establishes the LLM as a Fortran/LAPACK expert. User message includes the natural language query + retrieved code chunks with metadata. LLM must
  cite file paths and line numbers in its response.
  - Citation/reference formatting: Each answer includes inline references like [file.f:L42-L87]. Retrieved chunks are displayed below the answer with syntax highlighting.
  - Streaming vs batch response: Streaming. Next.js API routes support streaming via the OpenAI SDK. Better UX — users see the answer forming in real-time.

  11. Framework Selection

  Choice: Custom Python pipeline (no framework)

  - LangChain vs LlamaIndex vs custom: Custom. Rationale:
    - LAPACK ingestion is a one-time batch job — no need for LangChain's chain abstractions
    - The retrieval pipeline is straightforward: embed query -> Pinecone search -> assemble context -> LLM call
    - Custom code is easier to debug and understand in a 1-week sprint
    - LangChain adds dependency weight and abstraction layers that obscure what's happening
    - This is a learning exercise — understanding the RAG pipeline internals is the point
  - Evaluation and observability needs: Manual evaluation with curated test queries. Log query/response pairs for review. No need for LangSmith or similar.
  - Integration requirements: Python ingestion script outputs to Pinecone. Next.js app reads from Pinecone + calls OpenAI. No framework coupling between ingestion and serving.

  ---
  Phase 3: Post-Stack Refinement

  12. Failure Mode Analysis

  - What happens when retrieval finds nothing relevant: If top similarity score < 0.3 threshold, return a "no relevant code found" message with suggestions to rephrase. Don't hallucinate
  an answer from irrelevant chunks.
  - How to handle ambiguous queries: Return the top-k results with scores and let the user evaluate. The LLM answer includes a confidence qualifier ("Based on the most relevant matches..."
   vs "I found an exact match..."). Short/vague queries get a prompt to be more specific.
  - Rate limiting and error handling: Vercel serverless functions have built-in rate limiting. OpenAI API errors (429, 500) get retried once with exponential backoff, then return a
  user-friendly error. Pinecone timeouts fall back to a "service temporarily unavailable" message.

  13. Evaluation Strategy

  - How to measure retrieval precision: Curate 20 test queries with known-correct subroutines as ground truth. Measure precision@5 (what fraction of top-5 results are relevant). Target:
  >70% relevant chunks in top-5.
  - Ground truth dataset for testing: Manual — write 20 queries covering:
    - Specific subroutine lookups ("What does DGESV do?")
    - Conceptual queries ("How does LU factorization work in LAPACK?")
    - Cross-cutting queries ("What subroutines handle error codes?")
    - Dependency queries ("What does DGEMM call?")
  - User feedback collection: Not for MVP. Could add thumbs up/down on answers as a stretch goal.

  14. Performance Optimization

  - Caching strategy for embeddings: Cache query embeddings in memory (Map object in Next.js API route). Identical queries skip the embedding API call. Low priority — embedding calls are
  fast and cheap.
  - Index optimization: Pinecone handles index optimization automatically. Using cosine similarity metric. No custom index configuration needed at this scale.
  - Query preprocessing: Lowercase and trim whitespace. Strip Fortran-specific noise words if present. No stemming or lemmatization — the embedding model handles semantic similarity.

  15. Observability

  - Logging for debugging retrieval issues: Log every query with: timestamp, query text, top-k results (IDs + scores), LLM response length, total latency. Store in Vercel function logs
  (free tier).
  - Metrics to track: Query latency (end-to-end), retrieval scores (avg top-k similarity), API error rates, queries per day.
  - Alerting needs: None for a sprint project. Monitor Vercel dashboard manually.

  16. Deployment & DevOps

  - CI/CD for index updates: None needed. LAPACK is static — single batch ingestion via local Python script. Re-run manually if chunking strategy changes.
  - Environment management: Two environments — local development and Vercel production. Same Pinecone index for both (single index is sufficient).
  - Secrets handling for API keys: Environment variables only. OPENAI_API_KEY and PINECONE_API_KEY stored in Vercel environment settings and local .env file (gitignored).

  ---
  AI Cost Analysis

  Development & Testing Costs (Estimated)

  ┌─────────────────────────────────────────────────┬────────┬────────┐
  │                      Item                       │ Tokens │  Cost  │
  ├─────────────────────────────────────────────────┼────────┼────────┤
  │ Embedding LAPACK (full ingestion)               │ ~2.4M  │ $0.05  │
  ├─────────────────────────────────────────────────┼────────┼────────┤
  │ Re-indexing experiments (3x)                    │ ~7.2M  │ $0.15  │
  ├─────────────────────────────────────────────────┼────────┼────────┤
  │ Query embedding during dev (~200 queries)       │ ~10K   │ <$0.01 │
  ├─────────────────────────────────────────────────┼────────┼────────┤
  │ LLM answer generation during dev (~200 queries) │ ~700K  │ $0.15  │
  ├─────────────────────────────────────────────────┼────────┼────────┤
  │ Total development spend                         │        │ ~$0.35 │
  └─────────────────────────────────────────────────┴────────┴────────┘

  Production Cost Projections

  Assumptions: 5 queries/user/day, 30 days/month, ~3K input tokens + ~500 output tokens per LLM call, query embedding negligible.

  ┌─────────────────────┬───────────┬────────────────┬──────────────┬────────────────────┐
  │      Component      │ 100 Users │  1,000 Users   │ 10,000 Users │   100,000 Users    │
  ├─────────────────────┼───────────┼────────────────┼──────────────┼────────────────────┤
  │ Queries/month       │ 15,000    │ 150,000        │ 1,500,000    │ 15,000,000         │
  ├─────────────────────┼───────────┼────────────────┼──────────────┼────────────────────┤
  │ LLM (GPT-4o-mini)   │ $11       │ $113           │ $1,125       │ $11,250            │
  ├─────────────────────┼───────────┼────────────────┼──────────────┼────────────────────┤
  │ Embedding (queries) │ <$1       │ <$1            │ $1           │ $6                 │
  ├─────────────────────┼───────────┼────────────────┼──────────────┼────────────────────┤
  │ Pinecone            │ $0 (free) │ $70 (Standard) │ $200         │ $500+              │
  ├─────────────────────┼───────────┼────────────────┼──────────────┼────────────────────┤
  │ Vercel hosting      │ $0 (free) │ $20 (Pro)      │ $20          │ $150+ (Enterprise) │
  ├─────────────────────┼───────────┼────────────────┼──────────────┼────────────────────┤
  │ Total/month         │ ~$12      │ ~$204          │ ~$1,346      │ ~$11,906           │
  └─────────────────────┴───────────┴────────────────┴──────────────┴────────────────────┘

  Key Cost Insight

  GPT-4o-mini dominates costs at scale. At 100K users, LLM calls are 95% of spend. Mitigation strategies:
  - Response caching for repeated queries
  - Reduce context window (fewer/shorter chunks)
  - Switch to even cheaper models as they become available
  - Add a usage quota per user

  ---
  Architecture Summary

  ┌─────────────────────┐     ┌──────────────────┐
  │  Python Ingestion   │     │   Next.js App    │
  │  (local, one-time)  │     │   (Vercel)       │
  │                     │     │                  │
  │  1. Scan .f files   │     │  User query      │
  │  2. Parse SUBROUTINE│     │       │          │
  │  3. Extract metadata│     │       ▼          │
  │  4. Embed chunks    │──┐  │  Embed query ────────► OpenAI
  │  5. Upsert to       │  │  │       │          │   embeddings
  │     Pinecone        │  │  │       ▼          │
  │                     │  │  │  Search ─────────────► Pinecone
  └─────────────────────┘  │  │       │          │
                           │  │       ▼          │
                           └──────────┘          │
                              │  Top-k chunks    │
                              │       │          │
                              │       ▼          │
                              │  LLM answer  ────────► OpenAI
                              │       │          │   GPT-4o-mini
                              │       ▼          │
                              │  Stream response │
                              │  + code snippets │
                              └──────────────────┘