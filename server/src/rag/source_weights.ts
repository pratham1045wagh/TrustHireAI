/**
 * CredRAG Source Weighting Module (Component 9 & 14)
 * Provides domain-specific hierarchy weights for resume evidence sources.
 *
 * Initial baseline parameters:
 *   WORK_EXPERIENCE = 1.00
 *   PROJECT         = 0.95
 *   CERTIFICATION   = 0.80
 *   EDUCATION       = 0.65
 *   SUMMARY         = 0.50
 *   SKILLS_ONLY     = 0.30
 *   OTHER           = 0.20
 *
 * Parameters are configurable and subject to experimental evaluation.
 */

import { getCredRAGConfig } from './config';
import { DocumentSection } from '../types';

export type CredRAGSourceType =
  | 'WORK_EXPERIENCE'
  | 'PROJECT'
  | 'CERTIFICATION'
  | 'EDUCATION'
  | 'SUMMARY'
  | 'SKILLS_ONLY'
  | 'OTHER';

export class SourceWeightService {
  /**
   * Resolves the canonical CredRAG source type from section name or metadata sourceType
   */
  public static resolveSourceType(
    section?: DocumentSection | string,
    metadataSourceType?: string
  ): CredRAGSourceType {
    if (metadataSourceType) {
      const upper = metadataSourceType.toUpperCase();
      if (upper === 'WORK_EXPERIENCE' || upper === 'EXPERIENCE') return 'WORK_EXPERIENCE';
      if (upper === 'PROJECT' || upper === 'PROJECTS') return 'PROJECT';
      if (upper === 'CERTIFICATION' || upper === 'CERTIFICATIONS') return 'CERTIFICATION';
      if (upper === 'EDUCATION') return 'EDUCATION';
      if (upper === 'SUMMARY') return 'SUMMARY';
      if (upper === 'SKILLS_ONLY' || upper === 'SKILLS') return 'SKILLS_ONLY';
    }

    if (section) {
      const lower = section.toLowerCase();
      if (lower === 'experience') return 'WORK_EXPERIENCE';
      if (lower === 'projects') return 'PROJECT';
      if (lower === 'certifications') return 'CERTIFICATION';
      if (lower === 'education') return 'EDUCATION';
      if (lower === 'summary') return 'SUMMARY';
      if (lower === 'skills') return 'SKILLS_ONLY';
    }

    return 'OTHER';
  }

  /**
   * Maps CredRAGSourceType to legacy ISkillEvidence sourceType
   */
  public static toLegacySourceType(
    sourceType: CredRAGSourceType
  ): 'PROJECT' | 'EXPERIENCE' | 'CERTIFICATION' | 'SUMMARY' | 'EDUCATION' | 'SKILLS_ONLY' {
    switch (sourceType) {
      case 'WORK_EXPERIENCE':
        return 'EXPERIENCE';
      case 'PROJECT':
        return 'PROJECT';
      case 'CERTIFICATION':
        return 'CERTIFICATION';
      case 'EDUCATION':
        return 'EDUCATION';
      case 'SUMMARY':
        return 'SUMMARY';
      case 'SKILLS_ONLY':
      default:
        return 'SKILLS_ONLY';
    }
  }

  /**
   * Returns the weight for the given source type using active configuration
   */
  public static getWeight(sourceType: CredRAGSourceType): number {
    const config = getCredRAGConfig();
    return config.sourceWeights[sourceType] ?? config.sourceWeights.OTHER;
  }
}
