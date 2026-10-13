/**
 * CredRAG Configuration Module
 * Centralizes all retrieval, ranking, diversity, and confidence hyperparameters.
 * Fully configurable via environment variables with support for dynamic ablation study overrides.
 */

export interface ICredRAGConfig {
  // Ablation Study Feature Toggles
  useKeyword: boolean;
  useMetadata: boolean;
  useReranking: boolean;
  useDiversity: boolean;
  useConfidence: boolean;
  useGeminiVerification: boolean;

  // Hybrid Retrieval Weights (Component 7 & 12)
  semanticWeight: number; // alpha (default 0.70)
  keywordWeight: number;  // beta (default 0.30)

  // Re-ranking Weights (Component 8 & 13)
  rerankWeights: {
    hybrid: number;         // w1: default 0.50
    source: number;         // w2: default 0.30
    skillRelevance: number; // w3: default 0.20
  };

  // Source Hierarchy Weights (Component 9 & 14)
  sourceWeights: {
    WORK_EXPERIENCE: number; // 1.00
    PROJECT: number;         // 0.95
    CERTIFICATION: number;   // 0.80
    EDUCATION: number;       // 0.65
    SUMMARY: number;         // 0.50
    SKILLS_ONLY: number;     // 0.30
    OTHER: number;           // 0.20
  };

  // Diversity Weight & Thresholds (Component 10 & 15)
  diversityWeight: number; // default 0.15

  // Credibility Confidence Formula Weights (Component 11 & 16)
  confidenceWeights: {
    semantic: number;  // default 0.35
    keyword: number;   // default 0.25
    source: number;    // default 0.25
    diversity: number; // default 0.15
  };

  // Verification Classification Thresholds (Component 16)
  thresholds: {
    strong: number;      // >= 80 -> Strong
    moderate: number;    // >= 60 -> Moderate
    needsReview: number; // >= 40 -> Needs Review
  };

  // Retrieval Limits
  topK: number;
  maxEvidenceSources: number;
  similarityThreshold: number;
}

const parseEnvBool = (key: string, defaultValue: boolean): boolean => {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  return val.toLowerCase() === 'true' || val === '1';
};

const parseEnvFloat = (key: string, defaultValue: number): number => {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseEnvInt = (key: string, defaultValue: number): number => {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const getDefaultCredRAGConfig = (): ICredRAGConfig => ({
  // Ablation flags (Requirement 32)
  useKeyword: parseEnvBool('CREDRAG_USE_KEYWORD', true),
  useMetadata: parseEnvBool('CREDRAG_USE_METADATA', true),
  useReranking: parseEnvBool('CREDRAG_USE_RERANKING', true),
  useDiversity: parseEnvBool('CREDRAG_USE_DIVERSITY', true),
  useConfidence: parseEnvBool('CREDRAG_USE_CONFIDENCE', true),
  useGeminiVerification: parseEnvBool('CREDRAG_USE_GEMINI_VERIFICATION', true),

  // Hybrid weights (Requirement 12)
  semanticWeight: parseEnvFloat('CREDRAG_SEMANTIC_WEIGHT', 0.70),
  keywordWeight: parseEnvFloat('CREDRAG_KEYWORD_WEIGHT', 0.30),

  // Re-ranking weights (Requirement 13)
  rerankWeights: {
    hybrid: parseEnvFloat('CREDRAG_RERANK_HYBRID_WEIGHT', 0.50),
    source: parseEnvFloat('CREDRAG_RERANK_SOURCE_WEIGHT', 0.30),
    skillRelevance: parseEnvFloat('CREDRAG_RERANK_SKILL_WEIGHT', 0.20),
  },

  // Source weights (Requirement 14)
  sourceWeights: {
    WORK_EXPERIENCE: parseEnvFloat('CREDRAG_SRC_WORK_EXPERIENCE', 1.00),
    PROJECT: parseEnvFloat('CREDRAG_SRC_PROJECT', 0.95),
    CERTIFICATION: parseEnvFloat('CREDRAG_SRC_CERTIFICATION', 0.80),
    EDUCATION: parseEnvFloat('CREDRAG_SRC_EDUCATION', 0.65),
    SUMMARY: parseEnvFloat('CREDRAG_SRC_SUMMARY', 0.50),
    SKILLS_ONLY: parseEnvFloat('CREDRAG_SRC_SKILLS_ONLY', 0.30),
    OTHER: 0.20,
  },

  // Diversity weight (Requirement 15)
  diversityWeight: parseEnvFloat('CREDRAG_DIVERSITY_WEIGHT', 0.15),

  // Confidence weights (Requirement 16)
  confidenceWeights: {
    semantic: parseEnvFloat('CREDRAG_CONF_SEMANTIC_WEIGHT', 0.35),
    keyword: parseEnvFloat('CREDRAG_CONF_KEYWORD_WEIGHT', 0.25),
    source: parseEnvFloat('CREDRAG_CONF_SOURCE_WEIGHT', 0.25),
    diversity: parseEnvFloat('CREDRAG_CONF_DIVERSITY_WEIGHT', 0.15),
  },

  // Classification thresholds (Requirement 16)
  thresholds: {
    strong: parseEnvInt('CREDRAG_THRESHOLD_STRONG', 80),
    moderate: parseEnvInt('CREDRAG_THRESHOLD_MODERATE', 60),
    needsReview: parseEnvInt('CREDRAG_THRESHOLD_NEEDS_REVIEW', 40),
  },

  topK: parseEnvInt('CREDRAG_TOP_K', 4),
  maxEvidenceSources: parseEnvInt('CREDRAG_MAX_EVIDENCE', 4),
  similarityThreshold: parseEnvFloat('CREDRAG_SIMILARITY_THRESHOLD', 0.40),
});

let activeConfig: ICredRAGConfig = getDefaultCredRAGConfig();

export const getCredRAGConfig = (): ICredRAGConfig => activeConfig;

export const setCredRAGConfig = (overrides: Partial<ICredRAGConfig>): ICredRAGConfig => {
  activeConfig = {
    ...activeConfig,
    ...overrides,
    rerankWeights: { ...activeConfig.rerankWeights, ...overrides.rerankWeights },
    sourceWeights: { ...activeConfig.sourceWeights, ...overrides.sourceWeights },
    confidenceWeights: { ...activeConfig.confidenceWeights, ...overrides.confidenceWeights },
    thresholds: { ...activeConfig.thresholds, ...overrides.thresholds },
  };
  return activeConfig;
};

export const resetCredRAGConfig = (): ICredRAGConfig => {
  activeConfig = getDefaultCredRAGConfig();
  return activeConfig;
};
