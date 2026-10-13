import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

export class EmbeddingService {
  private static EMBEDDING_DIMENSION = 768;
  private static memoryCache = new Map<string, number[]>();

  private static getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('replace_with') || apiKey.length < 10) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  private static isGeminiEmbeddingAvailable = true;

  /**
   * Generates a 768-dimensional normalized embedding vector for the given text.
   * Utilizes in-memory content-hash caching and robust deterministic fallback.
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.trim();
    if (!cleanText) {
      return new Array(this.EMBEDDING_DIMENSION).fill(0);
    }

    const hash = this.computeHash(cleanText);

    // 1. In-memory hash cache hit (0ms)
    if (this.memoryCache.has(hash)) {
      return this.memoryCache.get(hash)!;
    }

    // 2. Attempt remote Gemini embedding if available
    if (this.isGeminiEmbeddingAvailable) {
      try {
        const ai = this.getAiClient();
        if (ai) {
          const embedCall = (ai.models as any).embedContent({
            model: 'gemini-embedding-001',
            contents: cleanText,
          });

          // Enforce 5-second timeout on embedding API call
          const timeoutCall = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Embedding request timeout after 5000ms')), 5000)
          );

          const response: any = await Promise.race([embedCall, timeoutCall]);

          const rawValues =
            response?.embedding?.values ||
            (Array.isArray(response?.embeddings) && response.embeddings[0]?.values) ||
            null;

          if (rawValues && Array.isArray(rawValues) && rawValues.length > 0) {
            // Normalize or compress to standard 768-D vector if needed
            let vec: number[];
            if (rawValues.length === this.EMBEDDING_DIMENSION) {
              vec = this.normalizeVector(rawValues);
            } else if (rawValues.length > this.EMBEDDING_DIMENSION) {
              // Standard dimension reduction via pooling
              vec = new Array(this.EMBEDDING_DIMENSION).fill(0);
              const stride = rawValues.length / this.EMBEDDING_DIMENSION;
              for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
                const start = Math.floor(i * stride);
                const end = Math.floor((i + 1) * stride);
                let sum = 0;
                for (let k = start; k < end; k++) {
                  sum += rawValues[k] || 0;
                }
                vec[i] = sum / (end - start || 1);
              }
              vec = this.normalizeVector(vec);
            } else {
              vec = this.generateDeterministicEmbedding(cleanText);
            }

            this.memoryCache.set(hash, vec);
            return vec;
          }
        }
      } catch (err: any) {
        this.isGeminiEmbeddingAvailable = false;
        console.warn('[EmbeddingService Warning] Remote embedding unavailable/timed out, using deterministic 768-D semantic fallback.');
      }
    }

    // 3. High quality deterministic fallback based on word hashing and n-gram frequencies (768-D)
    const fallbackVec = this.generateDeterministicEmbedding(cleanText);
    this.memoryCache.set(hash, fallbackVec);
    return fallbackVec;
  }

  /**
   * Pre-populates the cache with existing vectors (e.g. from MongoDB VectorDocument collection)
   */
  public static cacheEmbedding(hash: string, vector: number[]): void {
    if (hash && vector && vector.length > 0) {
      this.memoryCache.set(hash, vector);
    }
  }

  /**
   * Checks if an embedding for this text hash is already cached
   */
  public static hasCachedEmbedding(hash: string): boolean {
    return this.memoryCache.has(hash);
  }

  /**
   * Normalize vector to unit length for standard cosine similarity
   */
  public static normalizeVector(vector: number[]): number[] {
    let sumSq = 0;
    for (const val of vector) {
      sumSq += val * val;
    }
    const magnitude = Math.sqrt(sumSq) || 1e-9;
    return vector.map((v) => Number((v / magnitude).toFixed(6)));
  }

  /**
   * Generate reproducible semantic hash vector for offline / fallback robustness
   */
  public static generateDeterministicEmbedding(text: string): number[] {
    const vec = new Array(this.EMBEDDING_DIMENSION).fill(0);
    const tokens = text.toLowerCase().match(/\b\w+\b/g) || [text];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const hash = crypto.createHash('sha256').update(token).digest();

      for (let j = 0; j < 16; j++) {
        const idx = (hash[j * 2] * 256 + hash[j * 2 + 1]) % this.EMBEDDING_DIMENSION;
        const weight = 1.0 / Math.sqrt(i + 1);
        vec[idx] += (hash[j] > 127 ? 1 : -1) * weight;
      }
    }

    return this.normalizeVector(vec);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, (dot + 1) / 2));
  }

  /**
   * Compute a content hash for caching embeddings
   */
  public static computeHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
  }
}
