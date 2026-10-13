import { VectorDocument, IVectorDocumentDoc } from '../models/VectorDocument';
import { IVectorDocument } from '../types';
import { EmbeddingService } from './embedding.service';

export interface IVectorSearchResult {
  document: IVectorDocument;
  similarity: number;
}

export interface IVectorStoreFilter {
  documentType?: 'resume' | 'job' | 'skill';
  userId?: string;
  resumeId?: string;
  jobId?: string;
  section?: string;
  skill?: string;
}

export class VectorStoreService {
  /**
   * Insert multiple vector documents into the vector store
   */
  public static async insertDocuments(docs: Partial<IVectorDocument>[]): Promise<any[]> {
    if (!docs || docs.length === 0) return [];
    return VectorDocument.insertMany(docs as any[]);
  }

  /**
   * Delete vector chunks by resumeId or jobId
   */
  public static async deleteByDocumentId(documentId: string): Promise<number> {
    const res = await VectorDocument.deleteMany({
      $or: [{ documentId }, { resumeId: documentId }, { jobId: documentId }],
    });
    return res.deletedCount || 0;
  }

  /**
   * Query vector database using cosine similarity and metadata filtering
   */
  public static async similaritySearch(
    queryEmbedding: number[],
    filter: IVectorStoreFilter = {},
    topK: number = 5
  ): Promise<IVectorSearchResult[]> {
    const query: any = {};
    if (filter.documentType) query.documentType = filter.documentType;
    if (filter.userId) query.userId = filter.userId;
    if (filter.resumeId) query.resumeId = filter.resumeId;
    if (filter.jobId) query.jobId = filter.jobId;
    if (filter.section) query.section = filter.section;
    if (filter.skill) query.skill = new RegExp(`^${filter.skill}$`, 'i');

    const docs = await VectorDocument.find(query).lean();
    if (!docs || docs.length === 0) return [];

    const scored = docs.map((doc: any) => ({
      document: {
        _id: doc._id.toString(),
        documentId: doc.documentId?.toString(),
        userId: doc.userId?.toString(),
        resumeId: doc.resumeId?.toString(),
        jobId: doc.jobId?.toString(),
        chunkId: doc.chunkId,
        documentType: doc.documentType,
        section: doc.section,
        skill: doc.skill,
        text: doc.text,
        embedding: doc.embedding,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
      },
      similarity: EmbeddingService.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
  }

  /**
   * Get vector database health, document count and stats
   */
  public static async getStatus(): Promise<{
    status: string;
    totalDocuments: number;
    resumeChunks: number;
    jobChunks: number;
    embeddingDimension: number;
    provider: string;
  }> {
    const total = await VectorDocument.countDocuments();
    const resumeChunks = await VectorDocument.countDocuments({ documentType: 'resume' });
    const jobChunks = await VectorDocument.countDocuments({ documentType: 'job' });

    return {
      status: 'HEALTHY',
      totalDocuments: total,
      resumeChunks,
      jobChunks,
      embeddingDimension: 768,
      provider: 'MongoDB Hybrid Vector Store',
    };
  }
}
