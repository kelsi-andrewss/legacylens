// Test environment setup — provide dummy env vars so modules that read
// process.env at import time don't throw.
process.env.OPENAI_API_KEY = 'test-key';
process.env.PINECONE_API_KEY = 'test-key';
process.env.PINECONE_INDEX = 'test-index';
