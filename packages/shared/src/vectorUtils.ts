import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client (singleton)
let pineconeClient: Pinecone | null = null;

export const getPineconeClient = (): Pinecone => {
    if (!pineconeClient) {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY is not defined in environment variables');
        }
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return pineconeClient;
};

/**
 * Generates an embedding vector for the given text.
 *
 * Strategy (in priority order):
 *  1. Hugging Face Inference API  — free, remote, no cold starts (recommended for production)
 *  2. @xenova/transformers         — local, no API key needed (fallback for dev / offline)
 *
 * Set HF_API_KEY (or HUGGINGFACEHUB_API_TOKEN) in your .env to enable HF.
 * If neither key is set, falls back to local Xenova (development only).
 *
 * Model: sentence-transformers/all-MiniLM-L6-v2  → 384 dimensions, cosine similarity
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    const hfToken = process.env.HF_API_KEY || process.env.HUGGINGFACEHUB_API_TOKEN;

    if (hfToken) {
        return generateEmbeddingHF(text, hfToken);
    }

    // Fallback: local Xenova (works in dev, NOT recommended for Railway production)
    return generateEmbeddingLocal(text);
};

/**
 * Hugging Face Inference API embedding.
 * Free tier: 30,000 req/month — plenty for most ATS workloads.
 * Docs: https://huggingface.co/docs/api-inference/tasks/feature-extraction
 */
const generateEmbeddingHF = async (text: string, token: string): Promise<number[]> => {
    const MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
    const response = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: text,
                options: { wait_for_model: true }, // avoid 503 on cold model
            }),
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`HuggingFace embedding API error (${response.status}): ${err}`);
    }

    const result = await response.json() as number[] | number[][];

    // HF returns either a flat array [384] or a nested array [[384]] depending on input
    if (Array.isArray(result[0])) {
        return result[0] as number[];
    }
    return result as number[];
};

/**
 * Local embedding via @xenova/transformers.
 * Good for development / offline use. NOT recommended for Railway (model download on cold start).
 */
const generateEmbeddingLocal = async (text: string): Promise<number[]> => {
    try {
        // Dynamic import so this module is only loaded when actually needed
        const { pipeline, env } = await import('@xenova/transformers');
        env.allowLocalModels = false;
        env.useBrowserCache = false;

        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true,
        });

        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data as Float32Array);
    } catch (error) {
        console.error('Local embedding error:', error);
        throw new Error('Failed to generate embedding vector (local fallback also failed — set HF_API_KEY)');
    }
};

/**
 * Upserts a vector to a Pinecone index/namespace.
 */
export const upsertVector = async (
    indexName: string,
    namespace: string,
    vectorId: string,
    vector: number[],
    metadata: Record<string, any>
): Promise<void> => {
    try {
        const pc = getPineconeClient();
        const index = pc.index(indexName);
        await index.namespace(namespace).upsert([{ id: vectorId, values: vector, metadata }] as any);
    } catch (error) {
        console.error('Error upserting vector to Pinecone:', error);
        throw new Error('Failed to upsert vector to Pinecone');
    }
};

/**
 * Queries Pinecone for similar vectors.
 */
export const querySimilarVectors = async (
    indexName: string,
    namespace: string,
    queryVector: number[],
    topK: number = 10,
    filter?: Record<string, any>
): Promise<any[]> => {
    try {
        const pc = getPineconeClient();
        const index = pc.index(indexName);

        const queryOptions: any = {
            vector: queryVector,
            topK,
            includeMetadata: true,
        };

        if (filter) {
            queryOptions.filter = filter;
        }

        const queryResponse = await index.namespace(namespace).query(queryOptions);
        return queryResponse.matches;
    } catch (error) {
        console.error('Error querying Pinecone:', error);
        throw new Error('Failed to query similar vectors from Pinecone');
    }
};
