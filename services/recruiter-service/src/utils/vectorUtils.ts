import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

const getPineconeClient = (): Pinecone => {
    if (!pineconeClient) {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY is not defined in environment variables');
        }
        pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    }
    return pineconeClient;
};

/**
 * Generates an embedding vector for the given text.
 * Uses HuggingFace Inference API if HF_API_KEY is set, otherwise falls back to local Xenova.
 * Model: sentence-transformers/all-MiniLM-L6-v2 → 384 dimensions
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    const hfToken = process.env.HF_API_KEY || process.env.HUGGINGFACEHUB_API_TOKEN;
    if (hfToken) {
        return generateEmbeddingHF(text, hfToken);
    }
    return generateEmbeddingLocal(text);
};

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
            body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
        }
    );
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`HuggingFace embedding API error (${response.status}): ${err}`);
    }
    const result = await response.json() as number[] | number[][];
    if (Array.isArray(result[0])) return result[0] as number[];
    return result as number[];
};

const generateEmbeddingLocal = async (text: string): Promise<number[]> => {
    try {
        const { pipeline, env } = await import('@xenova/transformers');
        env.allowLocalModels = false;
        env.useBrowserCache = false;
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data as Float32Array);
    } catch (error) {
        throw new Error('Failed to generate embedding (set HF_API_KEY for production use)');
    }
};

export const querySimilarVectors = async (
    indexName: string,
    namespace: string,
    queryVector: number[],
    topK: number = 10,
    filter?: Record<string, any>
) => {
    const pc = getPineconeClient();
    const index = pc.index(indexName);
    const queryOptions: any = { vector: queryVector, topK, includeMetadata: true };
    if (filter) queryOptions.filter = filter;
    const queryResponse = await index.namespace(namespace).query(queryOptions);
    return queryResponse.matches;
};
