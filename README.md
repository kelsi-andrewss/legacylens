# LegacyLens

LegacyLens — RAG-powered explorer for LAPACK/BLAS Fortran source. Ask questions about numerical routines; get answers grounded in real source code.

**Deployed:** https://legacylens-b06nvam8b-kelsiandrews-3963s-projects.vercel.app

## Features

- Natural language RAG explorer with 4 query modes: Explain, Dependencies, Docs, Translate
- Dependency graph visualization
- Lens overlays for different perspectives
- Conversation history
- Mini-games: Routine Roulette, Similarity Showdown, Personality Quiz

## Tech stack

- **Frontend:** Next.js, Tailwind CSS
- **Embeddings:** OpenAI `text-embedding-3-small`
- **LLM:** GPT-4o-mini (streaming)
- **Vector DB:** Pinecone (7,759 vectors, 2,329 Fortran files)
- **Ingestion:** Custom Python Fortran parser

## Configuration

Create `.env.local` at the project root:

```
OPENAI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX=legacylens
```

- `OPENAI_API_KEY` — OpenAI API key (embeddings + chat)
- `PINECONE_API_KEY` — Pinecone API key
- `PINECONE_INDEX` — Pinecone index name (default: `legacylens`)

## Local Development

Node 18+ required.

```bash
git clone https://github.com/kelsi-andrewss/legacylens
cd legacylens
npm install
npm run dev
```

Open http://localhost:3000

## Data Ingestion

Clone LAPACK source and run the ingestion pipeline:

```bash
git clone https://github.com/Reference-LAPACK/lapack.git data/lapack
cd ingestion
pip install -r requirements.txt
python ingest.py
```

Re-runs use the embedding cache automatically — only new or changed files call the OpenAI embeddings API. Use `--dry-run` to test parsing without making any API calls.

## Architecture

See [docs/architecture.md](docs/architecture.md) for full RAG architecture details including vector DB selection rationale, chunking strategy, and retrieval pipeline design.

## Deployment

Deploys automatically to Vercel on push to `main` via GitHub Actions. See [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`
