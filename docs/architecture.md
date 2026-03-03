# LegacyLens — RAG Architecture Document

## Overview

LegacyLens is a Retrieval-Augmented Generation (RAG) system for querying and understanding the LAPACK (Linear Algebra PACKage) Fortran codebase. It enables developers to ask natural language questions about 600K+ lines of legacy Fortran code and receive contextual, cited answers.

## System Architecture

```
[Python ingestion script]  →  [Pinecone]  ←  [Next.js on Vercel]
   (local, one-time)           (cloud)        (API routes + UI)
```

### Components

#### 1. Ingestion Pipeline (Python, local)
- **File Discovery**: Recursively scans `SRC/` and `BLAS/SRC/` directories for `.f` files
- **Fortran Parser** (`parser.py`): Regex-based extraction of SUBROUTINE/FUNCTION boundaries
  - Handles Fortran fixed-format (columns 1-6 special handling)
  - Extracts: name, parameters, line numbers, CALL dependencies, comment blocks
  - Infers data type prefix (S/D/C/Z) and category (BLAS/LAPACK)
- **Chunking**: One chunk per subroutine/function. Oversized chunks (>1500 tokens) split with 10% overlap
- **Embedding**: OpenAI `text-embedding-3-small` (1536 dimensions), batched in groups of 100
- **Caching**: Local `.jsonl` file for resumability — embeddings are cached by chunk ID
- **Storage**: Pinecone vector database with rich metadata per chunk

#### 2. Query Pipeline (Next.js API Route)
- **Endpoint**: `POST /api/query` with `{ query, mode, filters }`
- **Process**:
  1. Embed user query with `text-embedding-3-small`
  2. Similarity search on Pinecone (top_k=5, optional metadata filters)
  3. Assemble context with metadata headers per chunk
  4. Stream GPT-4o-mini response with mode-specific system prompt
- **Streaming**: Server-Sent Events (SSE) for real-time response delivery

#### 3. Frontend (Next.js React)
- Search bar with query input
- Mode selector (4 code understanding features)
- Streaming markdown answer display
- Syntax-highlighted Fortran code snippets with file/line references
- Metadata filter sidebar (category, data type prefix)

## Embedding Strategy

| Parameter | Value |
|-----------|-------|
| Model | text-embedding-3-small |
| Dimensions | 1536 |
| Metric | Cosine similarity |
| Chunk strategy | One per routine, split at 1500 tokens |
| Overlap | 10% for split chunks |

### Why text-embedding-3-small?
- Best cost/performance ratio for code search
- 1536 dimensions provides sufficient semantic resolution for Fortran code
- Native support for code understanding without fine-tuning

## Metadata Schema

Each vector in Pinecone carries:
- `subroutine_name`: Routine identifier (e.g., DGESV)
- `kind`: SUBROUTINE, FUNCTION, or PROGRAM
- `file_path`: Relative path within LAPACK repo
- `line_start`, `line_end`: Source location (1-indexed)
- `parameters`: Comma-separated parameter list
- `dependencies`: CALL targets extracted from source
- `data_type_prefix`: S (single), D (double), C (complex), Z (double complex)
- `category`: BLAS or LAPACK
- `text`: Full source text of the chunk

## Code Understanding Features

1. **Code Explanation**: Plain English breakdown of algorithm, variables, mathematical operations
2. **Dependency Mapping**: Call graph analysis using extracted CALL metadata
3. **Documentation Generation**: Structured docs with purpose, parameters, algorithm, usage notes
4. **Translation Hints**: Modern Python/NumPy/SciPy and C/LAPACKE equivalents

## Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Vector DB | Pinecone | Managed service, no infra overhead, metadata filtering |
| Embeddings | OpenAI text-embedding-3-small | Cost-effective, good code understanding |
| LLM | GPT-4o-mini | Fast, cheap, sufficient for code explanation |
| Frontend | Next.js (App Router) | SSR + API routes in one deploy, Vercel native |
| Hosting | Vercel | Zero-config deployment from GitHub |

## Deployment

- **GitHub**: Source pushed to repository
- **Vercel**: Auto-deploys from main branch
- **Environment Variables**: OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX set in Vercel dashboard
- **Pinecone**: Index pre-populated by local ingestion run
