# Pre-Search Document: LegacyLens

**Codebase:** LAPACK (Fortran)
**Vector DB:** Pinecone
**Framework:** Custom Python Pipeline
**Embeddings:** OpenAI text-embedding-3-small

---

## Phase 1: Define Your Constraints

**1. Scale & Load Profile**
*   **Target codebase:** LAPACK (Linear Algebra PACKage). It's a large codebase containing hundreds of Fortran source files (`.f` or `.f90`) representing complex mathematical subroutines. We will focus on indexing the core factorization routines for the MVP.
*   **Expected query volume:** Very low for the MVP (single user/developer CLI testing).
*   **Batch ingestion or incremental updates:** Batch ingestion for the initial index. We will read the static `.f` files and process them sequentially.
*   **Latency requirements for queries:** Under 3 seconds end-to-end to meet performance targets.

**2. Budget & Cost Ceiling**
*   **Vector database hosting costs:** Pinecone Managed Cloud (Free Tier) to avoid infrastructure setup overhead and deploy immediately. $0.
*   **Embedding API costs:** Minimal. OpenAI `text-embedding-3-small` is highly cost-efficient (fractions of a cent per 1k tokens) while maintaining strong retrieval quality.
*   **LLM API costs for answer generation:** Moderate. Using `gpt-4o-mini` for speed and low cost during initial RAG development, stepping up to `gpt-4o` only if complex Fortran synthesis fails.
*   **Where will you trade money for time?** We are trading API usage (money) for managed infrastructure (time) by utilizing Pinecone instead of self-hosting Qdrant or Milvus.

**3. Time to Ship**
*   **MVP timeline:** 24 hours. The focus is purely on getting ingestion and CLI retrieval operational.
*   **Must-have vs nice-to-have features:** 
    *   *Must-have:* Basic ingestion, syntax-aware chunking (subroutines), vector storage, query embedding, CLI interface returning accurate file/line references.
    *   *Nice-to-have (Post-MVP):* Advanced code explanation features, deployed web UI, complex multi-query expansion.
*   **Framework learning curve acceptable?** No. To ship in 24 hours, a Custom Python script utilizing `pinecone-client` and `openai` avoids the abstraction complexities of LangChain or LlamaIndex when dealing with non-standard legacy syntax.

**4. Data Sensitivity**
*   **Is the codebase open source or proprietary?** Open Source (LAPACK is publicly available).
*   **Can you send code to external APIs?** Yes. We will send code chunks to OpenAI for embeddings and answer generation.
*   **Data residency requirements?** None.

**5. Team & Skill Constraints**
*   **Familiarity with vector databases:** Pinecone's API is simple and well-documented.
*   **Experience with RAG frameworks:** Opting for custom Python to maximize control over the unique chunking logic required for Fortran.
*   **Comfort with the target legacy language:** Fortran linear algebra is structured heavily around `SUBROUTINE` definitions, making syntax-aware chunking much simpler using regular expressions compared to deeply nested enterprise COBOL.

---

## Phase 2: Architecture Discovery

**6. Vector Database Selection**
*   **Selection:** Pinecone (Managed).
*   **Rationale:** The MVP requires a deployed, publicly accessible system fast. Pinecone eliminates local Docker setups and provides instant scale. We don't need complex hybrid search (vector + keyword) for the MVP, just strong cosine similarity filtering.
*   **Scaling characteristics:** Pinecone automatically scales, meaning we won't hit bottlenecks during initial ingestion of the LAPACK repository.

**7. Embedding Strategy**
*   **Selection:** OpenAI `text-embedding-3-small` (1536 dimensions).
*   **Rationale:** While Voyage Code 2 is code-specific, `text-embedding-3-small` provides an extremely cheap, fast, and reliable general-purpose baseline to prove out our custom pipeline logic. Fortran math subroutines may not benefit as drastically from an AST-aware model as highly abstract, modern C++ or Python would.
*   **Batch processing:** We will embed chunks in batches of 10-50 to avoid API rate limits and speed up ingestion.

**8. Chunking Approach**
*   **Strategy:** Syntax-aware semantic splitting (Custom Regex).
*   **Optimal chunk size:** We will not use fixed-size character chunking. Instead, we will define chunks by structural boundaries—specifically the Fortran `SUBROUTINE` and `END SUBROUTINE` keywords.
*   **Overlap strategy:** None initially, as subroutines represent complete logical units of execution.
*   **Metadata to preserve:** Absolute `file_path`, `start_line` number, `end_line` number, and the extracted `subroutine_name`. This is crucial for returning the required citations.

**9. Retrieval Pipeline**
*   **Top-k value:** We will start with a baseline of $k=5$ similarity search to capture enough context for the answer generation.
*   **Re-ranking approach:** No re-ranking in the MVP to minimize latency and architectural complexity.
*   **Context window management:** The top 5 retrieved subroutines will be concatenated (with their metadata injected as headers) into the system prompt context window before passing it to the generative LLM.

**10. Answer Generation**
*   **LLM for synthesis:** OpenAI `gpt-4o-mini`.
*   **Prompt template design:** The system prompt will forcefully instruct the LLM: *"You are a Fortran expert. Answer the user's question using ONLY the provided codebase context snippets. For every factual claim or code reference, you MUST cite the file path and line number."*
*   **Streaming:** Yes, streaming to the CLI ensures a responsive feel, even if the overall generation takes 2-3 seconds.

**11. Framework Selection**
*   **Selection:** Custom Python Pipeline.
*   **Rationale:** LangChain/LlamaIndex generic `RecursiveCharacterTextSplitter` will destroy the mathematical integrity of Fortran subroutines. Building the ingestion script manually using native Python allows precise control over regex-based `SUBROUTINE` extraction and metadata injection into Pinecone.

---

## Phase 3: Post-Stack Refinement

**12. Failure Mode Analysis**
*   **What happens when retrieval finds nothing relevant?** If the Pinecone similarity score is below a certain threshold (e.g., `< 0.70`), the CLI must intercept the query and return: *"Code not found in indexed subroutines."* We must explicitly instruct the LLM not to hallucinate answers without context.
*   **How to handle ambiguous queries?** The LLM prompt should include an instruction to ask for clarification if the provided context chunks seem highly disjointed or irrelevant to the query.
*   **Rate limiting:** We will implement simple exponential backoff (`tenacity` library in Python) on our OpenAI embedding calls during batch ingestion.

**13. Evaluation Strategy**
*   **Measurement:** We will measure retrieval precision by querying specific math operations (e.g., "Find the subroutine responsible for LU decomposition without pivoting") and verifying if the top 1 result is the correct LAPACK file (e.g., `sgetf2.f`).
*   **Ground truth:** We will create a small manual dataset mapping 10 queries to their expected LAPACK subroutine file/line numbers for rapid regression testing during chunking iteration.

**14. Performance Optimization**
*   **Caching strategy:** We will save API embedding responses to a local `.jsonl` or SQLite file during the ingestion phase. If the ingestion script crashes or needs restarting, we won't re-spend tokens embedding identical subroutine text.

**15. Observability**
*   **Logging:** We will use standard Python `logging` to output:
    1.  The parsed query.
    2.  The metadata (file/line/score) of the top-$k$ Pinecone results.
    3.  Total token usage for generation to track budget.

**16. Deployment & DevOps**
*   **Secrets handling:** API keys (OpenAI, Pinecone) will be strictly managed via a `.env` file and `python-dotenv`. They will not be hardcoded or committed to the repository.
*   **Environment management:** We will use a standard `requirements.txt` to manage dependencies (`openai`, `pinecone-client`, `python-dotenv`, `numpy`) ensuring reproducibility.