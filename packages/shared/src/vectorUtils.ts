import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers to not use local file system for models
// This helps prevent issues in some environments. Models are downloaded and cached.
env.allowLocalModels = false;
env.useBrowserCache = false;

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

// Initialize Xenova Transformers pipeline for feature extraction (singleton)
let extractionPipeline: any = null;

export const getEmbeddingPipeline = async () => {
    if (!extractionPipeline) {
        // Use all-MiniLM-L6-v2 which outputs 384-dimensional vectors
        extractionPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true // Use quantized model for smaller size and faster inference
        });
    }
    return extractionPipeline;
};

/**
 * Generates an embedding vector for the given text using Xenova Transformers.
 * Returns an array of numbers (dimension 384).
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const extractor = await getEmbeddingPipeline();

        // Generate embedding
        const output = await extractor(text, { pooling: 'mean', normalize: true });

        // Convert Float32Array to standard JS Array
        return Array.from(output.data);
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding vector');
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
) => {
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
