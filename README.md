# LegacyLens

**RAG-powered explorer for legacy Fortran codebases**

Ask natural language questions about 600K+ lines of LAPACK/BLAS Fortran source code. LegacyLens retrieves relevant subroutines with syntax highlighting, file/line citations, and LLM-generated explanations.

**Live demo:** https://legacylens-b06nvam8b-kelsiandrews-3963s-projects.vercel.app

## What it does

- Semantic search across 7,759 chunks from 2,317 LAPACK/BLAS subroutines
- 4 query modes: Explain, Dependencies, Documentation, Translation hints
- Streaming answers with citations in `[SOURCE: file.f:L42-L87]` format
- Filter by category (LAPACK/BLAS) and data type (S/D/C/Z)

## Tech stack

- **Vector DB:** Pinecone (cosine similarity, 1536 dims)
- **Embeddings:** OpenAI text-embedding-3-small
- **LLM:** GPT-4o-mini (streaming)
- **Frontend:** Next.js 16, Tailwind CSS
- **Ingestion:** Custom Python Fortran parser

## Setup

### Prerequisites
- Node.js 20+
- Python 3.9+
- OpenAI API key
- Pinecone API key

### Local development

```bash
git clone https://github.com/kelsi-andrewss/legacylens
cd legacylens
npm install
```

Create `.env.local`:
```
OPENAI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX=legacylens
```

```bash
npm run dev
```

Open http://localhost:3000

### Ingestion

Clone LAPACK source and run the ingestion pipeline:

```bash
git clone https://github.com/Reference-LAPACK/lapack.git data/lapack
cd ingestion
pip install -r requirements.txt
python ingest.py
```

Ingestion takes ~10 minutes on first run. Results are cached in `ingestion/cache/` — subsequent runs skip already-embedded chunks.

## Architecture

See [docs/architecture.md](docs/architecture.md) for full RAG architecture details including vector DB selection rationale, chunking strategy, and retrieval pipeline design.

## Deployment

Deploys automatically to Vercel on push to `main` via GitHub Actions. See [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`
