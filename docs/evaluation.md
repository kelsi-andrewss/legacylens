# LegacyLens — Evaluation Plan

## Test Queries

The following 10 queries test different aspects of the RAG system:

### Basic Retrieval
1. "What does DGESV do?" — Should retrieve DGESV subroutine, explain it solves AX=B
2. "How does DGEMM work?" — Should retrieve BLAS matrix multiply routine
3. "What is DLANGE?" — Should retrieve the matrix norm routine

### Dependency Mapping (mode: dependencies)
4. "What does DGETRF call?" — Should show LU factorization dependencies (DGETF2, DLASWP, DTRSM, DGEMM)
5. "Show the call graph for DGESV" — Should show DGESV → DGETRF → DGETRS chain

### Documentation Generation (mode: docs)
6. "Generate documentation for ZHEEV" — Should produce structured docs for complex Hermitian eigenvalue routine
7. "Document the BLAS routine DAXPY" — Should produce docs for the basic BLAS y=ax+y operation

### Translation Hints (mode: translate)
8. "How would I write DGEMM in Python?" — Should suggest numpy.dot or scipy.linalg.blas.dgemm
9. "What's the modern equivalent of DGESVD?" — Should suggest numpy.linalg.svd

### Cross-cutting
10. "What's the difference between SGESV and DGESV?" — Should explain single vs double precision variants

## Metrics

### Precision@5
For each query, evaluate the top 5 retrieved chunks:
- **Relevant**: The chunk directly answers or is necessary context for the query
- **Precision@5** = relevant chunks / 5

Target: >70% average precision across all queries

### Latency
Measure end-to-end time from query submission to first streamed token.
Target: <3 seconds

### Qualitative Assessment
For each query, evaluate:
- Does the answer correctly explain the code?
- Are citations present and accurate?
- Is the mode-specific behavior working (deps show call graph, translate shows Python equivalents, etc.)?

## Running the Evaluation

Once deployed, run each query manually through the web UI and record:
1. Retrieved chunk names and relevance (Y/N)
2. Time to first token
3. Answer quality (1-5 scale)

Results will be appended to this file after the evaluation run.
