"""Ingestion pipeline: parse LAPACK, embed, upsert to Pinecone."""

import json
import os
import sys
import time
from pathlib import Path

import tiktoken
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone

from parser import FortranRoutine, discover_files, parse_file

# Load env from project root
load_dotenv(Path(__file__).parent.parent / ".env.local")

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX = os.environ.get("PINECONE_INDEX", "legacylens")
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
MAX_TOKENS = 1500
OVERLAP_RATIO = 0.1
BATCH_SIZE = 100

CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_FILE = CACHE_DIR / "embeddings.jsonl"

openai_client = OpenAI(api_key=OPENAI_API_KEY)
enc = tiktoken.encoding_for_model("gpt-4o-mini")


def count_tokens(text: str) -> int:
    return len(enc.encode(text))


def build_chunk_text(routine: FortranRoutine) -> str:
    """Build the text to embed for a routine."""
    header = f"# {routine.kind} {routine.name}\n"
    header += f"# File: {routine.file_path} Lines: {routine.line_start}-{routine.line_end}\n"
    header += f"# Category: {routine.category} | Type prefix: {routine.data_type_prefix}\n"
    if routine.parameters:
        header += f"# Parameters: {', '.join(routine.parameters)}\n"
    if routine.dependencies:
        header += f"# Calls: {', '.join(routine.dependencies)}\n"
    if routine.comment_block:
        header += f"\n{routine.comment_block}\n\n"
    header += routine.source
    return header


def split_chunk(text: str, max_tokens: int) -> list[str]:
    """Split oversized text into overlapping chunks."""
    tokens = enc.encode(text)
    if len(tokens) <= max_tokens:
        return [text]

    overlap = int(max_tokens * OVERLAP_RATIO)
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(enc.decode(chunk_tokens))
        if end >= len(tokens):
            break
        start = end - overlap
    return chunks


def load_cache() -> dict[str, list[float]]:
    """Load cached embeddings from jsonl file."""
    cache = {}
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            for line in f:
                entry = json.loads(line)
                cache[entry["id"]] = entry["embedding"]
    print(f"Loaded {len(cache)} cached embeddings")
    return cache


def save_to_cache(chunk_id: str, embedding: list[float]):
    """Append a single embedding to cache."""
    with open(CACHE_FILE, "a") as f:
        f.write(json.dumps({"id": chunk_id, "embedding": embedding}) + "\n")


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts via OpenAI."""
    response = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]


def make_chunk_id(routine: FortranRoutine, chunk_idx: int = 0) -> str:
    """Create a unique ID for a chunk."""
    # Use relative path from data dir for cleaner IDs
    path_part = routine.file_path.split("lapack/")[-1] if "lapack/" in routine.file_path else routine.file_path
    path_part = path_part.replace("/", "_").replace(".", "_")
    return f"{path_part}__{routine.name}__chunk{chunk_idx}"


def main():
    lapack_path = Path(__file__).parent.parent / "data" / "lapack"
    if not lapack_path.exists():
        print(f"LAPACK source not found at {lapack_path}")
        print("Clone it first: git clone https://github.com/Reference-LAPACK/lapack.git data/lapack")
        sys.exit(1)

    print("Discovering Fortran files...")
    files = discover_files(lapack_path)
    print(f"Found {len(files)} files")

    print("Parsing routines...")
    all_routines: list[FortranRoutine] = []
    for f in files:
        routines = parse_file(f)
        all_routines.extend(routines)
    print(f"Parsed {len(all_routines)} routines")

    # Build chunks
    print("Building chunks...")
    chunks: list[tuple[str, str, dict]] = []  # (id, text, metadata)
    for routine in all_routines:
        text = build_chunk_text(routine)
        parts = split_chunk(text, MAX_TOKENS)
        for i, part in enumerate(parts):
            chunk_id = make_chunk_id(routine, i)
            metadata = {
                "subroutine_name": routine.name,
                "kind": routine.kind,
                "file_path": routine.file_path.split("lapack/")[-1] if "lapack/" in routine.file_path else routine.file_path,
                "line_start": routine.line_start,
                "line_end": routine.line_end,
                "parameters": ", ".join(routine.parameters[:20]),  # Pinecone metadata limit
                "dependencies": ", ".join(routine.dependencies[:20]),
                "data_type_prefix": routine.data_type_prefix,
                "category": routine.category,
                "text": part[:9500],  # Pinecone metadata text limit
            }
            chunks.append((chunk_id, part, metadata))
    print(f"Created {len(chunks)} chunks")

    # Embed
    print("Embedding chunks...")
    cache = load_cache()
    to_embed: list[tuple[int, str]] = []  # (index, text)
    embeddings: dict[str, list[float]] = {}

    for i, (chunk_id, text, _) in enumerate(chunks):
        if chunk_id in cache:
            embeddings[chunk_id] = cache[chunk_id]
        else:
            to_embed.append((i, text))

    print(f"  {len(embeddings)} cached, {len(to_embed)} to embed")

    # Batch embed
    for batch_start in range(0, len(to_embed), BATCH_SIZE):
        batch = to_embed[batch_start : batch_start + BATCH_SIZE]
        texts = [text for _, text in batch]
        print(f"  Embedding batch {batch_start // BATCH_SIZE + 1}/{(len(to_embed) + BATCH_SIZE - 1) // BATCH_SIZE}...")

        try:
            batch_embeddings = embed_batch(texts)
        except Exception as e:
            print(f"  Error embedding batch: {e}")
            print("  Retrying in 10s...")
            time.sleep(10)
            batch_embeddings = embed_batch(texts)

        for (idx, _), emb in zip(batch, batch_embeddings):
            chunk_id = chunks[idx][0]
            embeddings[chunk_id] = emb
            save_to_cache(chunk_id, emb)

        # Rate limit courtesy
        if batch_start + BATCH_SIZE < len(to_embed):
            time.sleep(0.5)

    print(f"All {len(embeddings)} embeddings ready")

    # Upsert to Pinecone
    print("Upserting to Pinecone...")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX)

    vectors = []
    for chunk_id, text, metadata in chunks:
        vectors.append({
            "id": chunk_id,
            "values": embeddings[chunk_id],
            "metadata": metadata,
        })

    # Batch upsert
    upsert_batch_size = 100
    for batch_start in range(0, len(vectors), upsert_batch_size):
        batch = vectors[batch_start : batch_start + upsert_batch_size]
        print(f"  Upserting batch {batch_start // upsert_batch_size + 1}/{(len(vectors) + upsert_batch_size - 1) // upsert_batch_size}...")
        index.upsert(vectors=batch)

    # Verify
    stats = index.describe_index_stats()
    print(f"\nDone! Pinecone index stats: {stats}")
    print(f"Total vectors: {stats.get('total_vector_count', 'unknown')}")


if __name__ == "__main__":
    main()
