# LegacyLens — AI Cost Analysis

## Development Costs (Actual)

### Embedding Generation
- **Model**: text-embedding-3-small
- **Rate**: $0.02 per 1M tokens
- **Estimated tokens**: ~3,500 routines × ~500 tokens avg = 1.75M tokens
- **Cost**: ~$0.035

### LLM Usage During Development
- **Model**: GPT-4o-mini for testing queries
- **Rate**: $0.15/1M input, $0.60/1M output
- **Estimated dev queries**: ~50 queries × ~3K input + ~500 output tokens
- **Cost**: ~$0.04

### Total Development Cost: ~$0.08

## Production Cost Projections

### Per-Query Cost
| Component | Tokens | Rate | Cost |
|-----------|--------|------|------|
| Query embedding | ~20 tokens | $0.02/1M | $0.0000004 |
| Pinecone query | N/A | Free tier: 100K queries/mo | $0.00 |
| GPT-4o-mini input | ~3,000 tokens (context) | $0.15/1M | $0.00045 |
| GPT-4o-mini output | ~500 tokens | $0.60/1M | $0.00030 |
| **Total per query** | | | **~$0.00075** |

### Monthly Projections

| Usage Level | Queries/mo | Monthly Cost |
|-------------|-----------|--------------|
| Light (demo) | 100 | $0.08 |
| Moderate | 1,000 | $0.75 |
| Heavy | 10,000 | $7.50 |
| Production | 100,000 | $75.00 |

### Infrastructure Costs
| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Pinecone | Starter (free) | $0.00 |
| Vercel | Hobby (free) | $0.00 |
| OpenAI API | Pay-as-you-go | Variable (see above) |

## Cost Optimization Opportunities

1. **Caching**: Cache frequent queries (e.g., "What does DGESV do?") to avoid repeated LLM calls
2. **Smaller context**: Reduce top_k from 5 to 3 for simpler queries
3. **Response length**: Set lower max_tokens for explanation mode
4. **Batch queries**: Group related questions to amortize embedding cost

## Comparison: Build vs. Buy

| Approach | Setup Cost | Per-Query | Notes |
|----------|-----------|-----------|-------|
| LegacyLens (custom RAG) | ~$0.08 | ~$0.00075 | Full control, custom features |
| ChatGPT with file upload | $20/mo subscription | Included | Limited to 10 files, no metadata |
| GitHub Copilot | $10/mo | Included | No LAPACK-specific features |
| Commercial RAG (Glean, etc.) | $1000+/mo | Included | Overkill for single codebase |
