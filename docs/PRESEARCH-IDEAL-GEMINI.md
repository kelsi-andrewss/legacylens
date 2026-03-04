# LegacyLens: Ideal Pre-Search Architecture (LAPACK RAG)

**Target Codebase:** LAPACK (Fortran 77/90) — ~600,000 LOC, ~1,700 files, ~3,500 subroutines
**Vector Database:** Pinecone (Serverless / Managed Cloud)
**Frameworks:** Custom Python Pipeline (Ingestion) + Next.js (Full-stack Deployment on Vercel)
**Embeddings:** OpenAI `text-embedding-3-small` (1,536 dimensions)
**LLM:** OpenAI `gpt-4o-mini` (Synthesis & Explanation)

---

## Phase 1: Define Your Constraints

### 1. Scale & Load Profile
*   **Target Codebase:** LAPACK is the industry standard for linear algebra. It is highly structured but uses legacy Fortran syntax. The index will contain ~3,500 vectors (one per subroutine/function).
*   **Expected Query Volume:** 10–50 queries/day for MVP; projecting up to 5 queries/user/day for production.
*   **Ingestion Logic:** One-time batch ingestion. Re-indexing is only necessary if the chunking/metadata strategy is updated.
*   **Latency:** < 3 seconds end-to-end (Retrieval < 500ms, LLM Synthesis < 2s).

### 2. Budget & Cost Ceiling
*   **Vector DB:** $0/month (Pinecone Starter/Free tier). 3,500 vectors at 1536 dims occupy < 50MB, well within the 2GB free limit.
*   **Embeddings:** $0.02/1M tokens. Total codebase (~2.4M tokens) costs ~$0.05 for a full re-index.
*   **LLM (gpt-4o-mini):** ~$0.00075 per query. Extremely cost-effective for high-volume testing.
*   **Tradeoff:** Trading API fees for development speed. Managed services (Pinecone/Vercel) eliminate weeks of infrastructure work in a 7-day sprint.

### 3. Time to Ship
*   **MVP Deadline:** 24 Hours. Basic ingestion + retrieval + web UI + deployment.
*   **Framework Selection:** **Custom Python over LangChain.** LangChain's abstractions add unnecessary overhead for a straightforward LAPACK pipeline. Custom code allows precise Regex control for legacy Fortran boundaries.

### 4. Data Sensitivity
*   **Status:** Open source (BSD-3-Clause).
*   **API Usage:** Sending code to OpenAI/Pinecone is permissible. No PII or proprietary IP risks.

### 5. Team & Skill Constraints
*   **Challenge:** Low Fortran experience. 
*   **Mitigation:** Leveraging LAPACK's strict naming conventions (e.g., `DGESV` = Double General Equation Solver). We will index metadata prefixes (S/D/C/Z) to help users find the correct precision level.

---

## Phase 2: Architecture Discovery

### 6. Vector Database Selection: Pinecone
*   **Selection:** Pinecone (Managed).
*   **Why:** Fastest deployment path. Next.js can query the REST API directly from serverless functions.
*   **Metadata Filtering:** Essential. We will filter by `data_type` (Single/Double), `file_path`, and `category` (BLAS vs. LAPACK) to refine search results.

### 7. Embedding Strategy: text-embedding-3-small
*   **Selection:** OpenAI 1536-dim model.
*   **Rationale:** Superior cost-to-performance ratio. While Voyage Code 2 is code-optimized, LAPACK subroutines are heavily documented in English within the source code, which general-purpose models handle exceptionally well.

### 8. Chunking Approach: Syntax-Aware (Subroutine Level)
*   **Strategy:** Splitting files at `SUBROUTINE` and `FUNCTION` keywords.
*   **Handling Legacy Syntax:** We must use Regex that accounts for Fortran's fixed-format comments (column 1 'C' or '*') and the trailing `END SUBROUTINE` markers.
*   **Metadata Extraction:** 
    *   **Precision Prefix:** Extract the first letter (S, D, C, Z) to differentiate between Single, Double, Complex, and Double-Complex math.
    *   **Parameter List:** Extract arguments to help the LLM explain usage.
    *   **Dependencies:** Regex scan for `CALL` statements to build a basic dependency graph within the context.

### 9. Retrieval Pipeline
*   **Top-K:** $k=5$. Provides enough context (~4,000 tokens) for `gpt-4o-mini` while staying far below context limits.
*   **Similarity Threshold:** 0.70. Queries scoring lower will be treated as "No relevant code found" to prevent LLM hallucinations.

### 10. Answer Generation: gpt-4o-mini
*   **Reasoning:** $10	imes$ cheaper than `gpt-4o` with $90\%$ of the reasoning capability for code explanation. 
*   **Instruction Set:** LLM must cite file paths and line ranges (e.g., `dgetrf.f:L112-L240`) in every response.

---

## Phase 3: Post-Stack Refinement

### 11. Failure Mode Analysis
*   **Retrieval Failures:** Handled by a "Low Confidence" UI state if Pinecone scores are low.
*   **Ambiguity:** If a user asks "How do I solve math?", the system will prompt for a specific operation (e.g., LU Factorization).

### 12. Evaluation Strategy
*   **Metric:** Precision@5. Target > 75% relevance for core LAPACK lookups.
*   **Testing:** 20 "Ground Truth" queries mapping math concepts (e.g., "Singular Value Decomposition") to their exact LAPACK filename (`dgesvd.f`).

### 13. Observability
*   **Logging:** Vercel logs for query latency. local JSON logs for ingestion progress.
*   **Metrics:** Average Top-1 similarity score over time to monitor index health.

---

## AI Cost Analysis

### 1. Development Costs (1-Week Sprint)
| Item | Details | Cost |
| :--- | :--- | :--- |
| **Ingestion** | ~2.4M tokens embedded (3x re-index) | $0.20 |
| **LLM Testing** | ~500 queries (3.5k tokens/query) | $0.80 |
| **Vector DB** | Pinecone Free Tier | $0.00 |
| **Total Dev Cost** | | **~$1.00** |

### 2. Production Cost Projections
*Assumes: 5 queries/user/day, 30 days/month, gpt-4o-mini.*

| Scale | Queries/Mo | Infrastructure (DB/Hosting) | AI Usage (LLM/Embed) | Total Monthly |
| :--- | :--- | :--- | :--- | :--- |
| **100 Users** | 15,000 | $0 (Free Tiers) | $12 | **$12** |
| **1,000 Users** | 150,000 | $90 (Standard Tiers) | $114 | **$204** |
| **10,000 Users** | 1.5M | $220 (Scaling) | $1,126 | **$1,346** |
| **100,000 Users** | 15M | $650 (Enterprise) | $11,256 | **$11,906** |

---

## Architecture Summary (Ideal Pipeline)

1.  **Ingestion:** Local Python script reads LAPACK `.f` files -> Regex-extracts subroutines -> Extracts precision metadata (S/D/C/Z) -> Embeds via OpenAI -> Upserts to Pinecone.
2.  **Retrieval:** Next.js UI (Vercel) -> Embeds user query -> Pinecone Similarity Search (filtered by precision if specified) -> Returns top-5 chunks.
3.  **Synthesis:** Next.js API assembles chunks into a "Fortran Expert" prompt -> `gpt-4o-mini` generates explanation with citations -> Streams to user.
4.  **UI:** Displays answer in Markdown with syntax-highlighted code blocks and clickable file references.