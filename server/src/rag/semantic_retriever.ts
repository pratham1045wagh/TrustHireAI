/**
 * CredRAG Semantic Retrieval Module (Component 4 & 5, Requirements 9 & 10)
 * Performs vector similarity retrieval with strict candidate and resume isolation.
 */

import { VectorDocument } from '../models/VectorDocument';
import { EmbeddingService } from '../services/embedding.service';
import { IVectorDocument } from '../types';
import { getCredRAGConfig } from './config';

export interface ISemanticCandidate {
  document: IVectorDocument;
  semanticScore: number; // 0.0 - 1.0
}

export class SemanticRetriever {
  /**
   * Retrieves semantic evidence candidates strictly isolated to candidateId and resumeId
   */
  public static async retrieve(
    candidateId: string,
    resumeId: string,
    queryText: string,
    topK: number = 10
  ): Promise<ISemanticCandidate[]> {
    const config = getCredRAGConfig();

    // 1. Generate query embedding
    const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);

    // 2. Strict metadata boundary filter (Requirements 9 & 20)
    // NEVER retrieve chunks across resumes or across candidates!
    const filterQuery: any = {
      documentType: 'resume',
      userId: candidateId,
    };

    if (config.useMetadata && resumeId) {
      filterQuery.resumeId = resumeId;
    }

    // Evidence-bearing sections prioritized
    const evidenceSections = ['projects', 'experience', 'certifications', 'education', 'summary', 'skills'];
    filterQuery.section = { $in: evidenceSections };

    const docs = await VectorDocument.find(filterQuery).lean();
    if (!docs || docs.length === 0) {
      return [];
    }

    // 3. Compute cosine similarity against strictly filtered chunks
    const candidates: ISemanticCandidate[] = docs.map((doc: any) => {
      const similarity = EmbeddingService.cosineSimilarity(queryEmbedding, doc.embedding || []);
      const docFormatted: IVectorDocument = {
        _id: doc._id.toString(),
        documentId: doc.documentId?.toString(),
        userId: doc.userId?.toString(),
        resumeId: doc.resumeId?.toString(),
        chunkId: doc.chunkId,
        documentType: doc.documentType,
        section: doc.section,
        sourceType: doc.sourceType || doc.metadata?.sourceType,
        skills: doc.skills || [],
        skill: doc.skill,
        text: doc.text,
        embedding: doc.embedding,
        contentHash: doc.contentHash,
        metadata: doc.metadata || {},
        createdAt: doc.createdAt,
      };

      return {
        document: docFormatted,
        semanticScore: Number(similarity.toFixed(4)),
      };
    });

    // Sort descending by semantic similarity
    candidates.sort((a, b) => b.semanticScore - a.semanticScore);

    return candidates.slice(0, topK);
  }
}
