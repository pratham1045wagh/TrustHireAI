/**
 * TrustHireAI — CredRAG Complete Test Suite & Empirical Benchmark Runner
 * Tests all 12 CredRAG components, end-to-end integration, resume isolation,
 * TrustScore compatibility, and executes the 6-mode ablation benchmark.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Resume } from '../models/Resume';
import { VectorDocument } from '../models/VectorDocument';
import { SkillEvidence } from '../models/SkillEvidence';
import { VerificationReport } from '../models/VerificationReport';
import {
  CredRAG,
  QueryBuilder,
  CredRAGChunker,
  SemanticRetriever,
  KeywordRetriever,
  HybridRetriever,
  EvidenceReranker,
  DiversitySelector,
  EvidenceScorer,
  GeminiEvidenceVerifier,
  CredRAGEvaluator,
  SourceWeightService,
  getCredRAGConfig,
  setCredRAGConfig,
} from '../rag';
import { VerificationService } from '../services/verification.service';
import { IResumeAnalysis } from '../types';

async function runTestSuite() {
  console.log('================================================================');
  console.log('  TrustHireAI — CredRAG Verification & Benchmark Test Suite    ');
  console.log('================================================================\n');

  await connectDB();

  try {
    // -------------------------------------------------------------
    // Test 1: Query Builder & Controlled Aliases (Requirement 8)
    // -------------------------------------------------------------
    console.log('[Test 1] Testing QueryBuilder & Controlled Aliases...');
    const qReact = QueryBuilder.buildQuery('React');
    console.log(`  - Original: ${qReact.originalSkill}`);
    console.log(`  - Verification Query: "${qReact.verificationQuery}"`);
    console.log(`  - Lexical terms: [${qReact.lexicalTerms.join(', ')}]`);
    if (!qReact.verificationQuery.includes('React') || !qReact.lexicalTerms.includes('jsx')) {
      throw new Error('QueryBuilder failed to expand controlled aliases.');
    }
    console.log('  ✓ QueryBuilder passed.\n');

    // -------------------------------------------------------------
    // Test 2: Source Weights (Requirement 14)
    // -------------------------------------------------------------
    console.log('[Test 2] Testing SourceWeightService...');
    const wExp = SourceWeightService.getWeight('WORK_EXPERIENCE');
    const wProj = SourceWeightService.getWeight('PROJECT');
    const wCert = SourceWeightService.getWeight('CERTIFICATION');
    const wEdu = SourceWeightService.getWeight('EDUCATION');
    const wSkills = SourceWeightService.getWeight('SKILLS_ONLY');
    console.log(`  - WORK_EXPERIENCE: ${wExp}, PROJECT: ${wProj}, CERT: ${wCert}, EDU: ${wEdu}, SKILLS: ${wSkills}`);
    if (wExp < wProj || wProj < wCert || wCert < wEdu || wEdu < wSkills) {
      throw new Error('SourceWeightService hierarchy ordering invalid.');
    }
    console.log('  ✓ SourceWeightService passed.\n');

    // -------------------------------------------------------------
    // Test 3: Prepare Test Candidate & Isolated Resumes
    // -------------------------------------------------------------
    console.log('[Test 3] Setting up candidate and isolated resumes...');
    let candidate = await User.findOne({ email: 'credrag-test@trusthire.ai' });
    if (!candidate) {
      candidate = await User.create({
        name: 'Jordan Lee (CredRAG Test)',
        email: 'credrag-test@trusthire.ai',
        passwordHash: '$2a$10$xyzFakeHashForUnitTestingOnly123456789012345',
        role: 'CANDIDATE',
        isActive: true,
      });
    }
    const candidateId = candidate._id.toString();

    // Sample Resume Analysis
    const sampleAnalysis: IResumeAnalysis = {
      personalInfo: {
        fullName: 'Jordan Lee',
        email: 'credrag-test@trusthire.ai',
        phone: '+1-555-0199',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/jordanlee',
        github: 'https://github.com/jordanlee',
        portfolio: null,
      },
      summary: 'Senior Full Stack Engineer with 5+ years of production experience architecting React web applications and Node.js microservices.',
      skills: {
        programmingLanguages: ['TypeScript', 'JavaScript', 'Python'],
        frameworks: ['React', 'Next.js', 'Express', 'Tailwind CSS'],
        libraries: ['Redux Toolkit', 'Jest'],
        databases: ['MongoDB', 'PostgreSQL', 'Redis'],
        tools: ['Git', 'Docker', 'Webpack'],
        cloud: ['AWS', 'Google Cloud'],
        other: ['RESTful APIs', 'Microservices'],
      },
      experience: [
        {
          company: 'Acme Cloud Solutions',
          role: 'Lead Frontend Engineer',
          startDate: '2022-01',
          endDate: 'Present',
          description: [
            'Architected scalable frontend platforms using React, TypeScript, and Redux Toolkit serving 500K daily active users.',
            'Engineered custom React hooks and reusable component design systems reducing bundle size by 35%.',
            'Implemented high-throughput WebSocket dashboard integrating with Node.js backend microservices.',
          ],
        },
        {
          company: 'DataFlow Technologies',
          role: 'Software Engineer',
          startDate: '2020-03',
          endDate: '2021-12',
          description: [
            'Built responsive React Single Page Applications communicating with MongoDB and Express REST APIs.',
            'Designed automated CI/CD pipeline using Docker and GitHub Actions for continuous zero-downtime deployment.',
          ],
        },
      ],
      projects: [
        {
          name: 'TrustHireAI Verification Portal',
          role: 'Lead Architect',
          description: 'Engineered an AI-driven candidate credibility platform using React, Node.js, and MongoDB vector store with evidence-based verification.',
          technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker'],
          duration: '6 months',
        },
        {
          name: 'RealTime Analytics Dashboard',
          role: 'Full Stack Creator',
          description: 'Interactive analytics dashboard visualizing time-series metrics using React, Tailwind CSS, and Redis pub/sub.',
          technologies: ['React', 'Redis', 'Python', 'Tailwind CSS'],
          duration: '4 months',
        },
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          institution: 'University of California, Berkeley',
          field: 'Computer Science',
          startYear: '2016',
          endYear: '2020',
          grade: '3.8 GPA',
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          date: '2023-05',
        },
      ],
    };

    // Clean any prior test resumes
    await Resume.deleteMany({ userId: candidateId });
    await VectorDocument.deleteMany({ userId: candidateId });
    await SkillEvidence.deleteMany({ candidateId });
    await VerificationReport.deleteMany({ candidateId });

    // Create Resume A
    const resumeA = await Resume.create({
      userId: candidateId,
      originalFileName: 'Jordan_Lee_Resume_A.pdf',
      fileSize: 45000,
      filePath: 'uploads/test_resume_a.pdf',
      status: 'ANALYZED',
      analysis: sampleAnalysis,
    });
    const resumeAId = resumeA._id.toString();

    // Create Resume B (for candidate isolation verification)
    const resumeB = await Resume.create({
      userId: candidateId,
      originalFileName: 'Jordan_Lee_Resume_B.pdf',
      fileSize: 42000,
      filePath: 'uploads/test_resume_b.pdf',
      status: 'ANALYZED',
      analysis: {
        ...sampleAnalysis,
        summary: 'Data Scientist specializing in Python, PyTorch, and Machine Learning.',
        skills: {
          programmingLanguages: ['Python', 'R'],
          frameworks: ['PyTorch', 'TensorFlow'],
          libraries: ['NumPy', 'Pandas'],
          databases: ['PostgreSQL'],
          tools: ['Jupyter'],
          cloud: ['AWS'],
          other: ['Machine Learning'],
        },
      },
    });
    const resumeBId = resumeB._id.toString();

    console.log(`  - Candidate ID: ${candidateId}`);
    console.log(`  - Resume A (Full Stack): ${resumeAId}`);
    console.log(`  - Resume B (Data Science): ${resumeBId}`);
    console.log('  ✓ Test candidates and resumes prepared.\n');

    // -------------------------------------------------------------
    // Test 4: CredRAG Skill-Aware Chunking (Requirement 6)
    // -------------------------------------------------------------
    console.log('[Test 4] Testing CredRAG Skill-Aware Chunking...');
    const chunksA = await CredRAG.indexResume(resumeAId, candidateId, sampleAnalysis);
    console.log(`  - Indexed ${chunksA} chunks for Resume A.`);
    if (chunksA < 5) {
      throw new Error(`Expected at least 5 chunks for Resume A, got ${chunksA}`);
    }

    const sampleChunk = await VectorDocument.findOne({ resumeId: resumeAId, section: 'projects' });
    console.log(`  - Sample Project Chunk section: ${sampleChunk?.section}`);
    console.log(`  - Sample Project Chunk sourceType: ${sampleChunk?.sourceType}`);
    console.log(`  - Sample Project Chunk associated skills: [${(sampleChunk?.skills || []).join(', ')}]`);
    if (sampleChunk?.sourceType !== 'PROJECT') {
      throw new Error(`Expected sourceType to be 'PROJECT', got ${sampleChunk?.sourceType}`);
    }
    console.log('  ✓ Skill-Aware Chunking verified.\n');

    // -------------------------------------------------------------
    // Test 5: Strict Resume Isolation (Requirement 20)
    // -------------------------------------------------------------
    console.log('[Test 5] Testing Strict Resume-Level Isolation...');
    // Index Resume B
    await CredRAG.indexResume(resumeBId, candidateId, resumeB.analysis as any);

    // Retrieve evidence for React on Resume A
    const retrievedA = await SemanticRetriever.retrieve(candidateId, resumeAId, 'React');
    const crossContaminated = retrievedA.filter((c) => c.document.resumeId !== resumeAId);
    if (crossContaminated.length > 0) {
      throw new Error(`Resume isolation breach: Found chunks from other resumes!`);
    }
    console.log(`  - Retrieved ${retrievedA.length} candidates for Resume A. Cross-contaminated: ${crossContaminated.length}`);
    console.log('  ✓ Resume isolation strictly enforced.\n');

    // -------------------------------------------------------------
    // Test 6: Semantic + Lexical + Hybrid Retrieval (Requirements 10, 11, 12)
    // -------------------------------------------------------------
    console.log('[Test 6] Testing Hybrid Retrieval for "React"...');
    const sem = await SemanticRetriever.retrieve(candidateId, resumeAId, qReact.verificationQuery, 5);
    const kw = await KeywordRetriever.retrieve(candidateId, resumeAId, 'React', qReact.lexicalTerms, 5);
    const hybrid = HybridRetriever.fuse(sem, kw);

    console.log(`  - Semantic candidates: ${sem.length} (top score: ${(sem[0]?.semanticScore * 100).toFixed(1)}%)`);
    console.log(`  - Keyword candidates: ${kw.length} (top score: ${(kw[0]?.keywordScore * 100).toFixed(1)}%)`);
    console.log(`  - Hybrid merged candidates: ${hybrid.length} (top score: ${(hybrid[0]?.hybridScore * 100).toFixed(1)}%)`);
    if (hybrid.length === 0) {
      throw new Error('Hybrid retriever returned 0 candidates for React.');
    }
    console.log('  ✓ Hybrid retrieval verified.\n');

    // -------------------------------------------------------------
    // Test 7: Multi-Factor Re-ranking & Source Hierarchy (Requirements 13 & 14)
    // -------------------------------------------------------------
    console.log('[Test 7] Testing Evidence Re-ranking...');
    const reranked = EvidenceReranker.rerank(hybrid, 'React');
    console.log(`  - Top re-ranked chunk: [${reranked[0].sourceType}] ${reranked[0].document.text.slice(0, 80)}...`);
    console.log(`  - EvidenceScore: ${(reranked[0].evidenceScore * 100).toFixed(1)}% (Hybrid: ${(reranked[0].hybridScore * 100).toFixed(1)}%, Source: ${(reranked[0].sourceWeight * 100).toFixed(1)}%, SkillRel: ${(reranked[0].skillRelevanceScore * 100).toFixed(1)}%)`);
    if (!reranked[0].evidenceScore || reranked[0].evidenceScore <= 0) {
      throw new Error('EvidenceReranker produced invalid evidence score.');
    }
    console.log('  ✓ Evidence Re-ranking verified.\n');

    // -------------------------------------------------------------
    // Test 8: Evidence Diversity Selection (Requirement 15)
    // -------------------------------------------------------------
    console.log('[Test 8] Testing Evidence Diversity Selection...');
    const diversityResult = DiversitySelector.select(reranked, 4);
    console.log(`  - Selected diverse items: ${diversityResult.selected.length}`);
    console.log(`  - Unique sources count: ${diversityResult.uniqueSourcesCount}`);
    console.log(`  - Diversity Score: ${(diversityResult.diversityScore * 100).toFixed(1)}%`);
    for (let i = 0; i < diversityResult.selected.length; i++) {
      const itm = diversityResult.selected[i];
      const title = (itm.document.metadata?.sourceTitle as string) || itm.document.section;
      console.log(`    [${i + 1}] Source: ${itm.sourceType} | Title: "${title}" | Score: ${(itm.evidenceScore * 100).toFixed(1)}%`);
    }
    if (diversityResult.diversityScore <= 0) {
      throw new Error('Diversity score should be positive.');
    }
    console.log('  ✓ Evidence Diversity Selection verified.\n');

    // -------------------------------------------------------------
    // Test 9: Credibility Confidence & Classification (Requirement 16)
    // -------------------------------------------------------------
    console.log('[Test 9] Testing Credibility Confidence Calculation...');
    const conf = EvidenceScorer.calculateConfidence(diversityResult.selected, diversityResult.diversityScore);
    console.log(`  - Credibility Confidence: ${conf.confidence}%`);
    console.log(`  - Verification Level: ${conf.verificationLevel}`);
    console.log(`  - Claimed Level: ${conf.claimedLevel}`);
    console.log(`  - Component relevances: Sem=${(conf.semanticRelevance * 100).toFixed(1)}%, Kw=${(conf.keywordRelevance * 100).toFixed(1)}%, Src=${(conf.sourceRelevance * 100).toFixed(1)}%, Div=${(conf.diversityScore * 100).toFixed(1)}%`);
    if (conf.confidence < 60) {
      throw new Error(`Expected at least Moderate confidence (>=60%) for strong React resume, got ${conf.confidence}%`);
    }
    console.log('  ✓ Credibility Confidence verified.\n');

    // -------------------------------------------------------------
    // Test 10: Full CredRAG Single Skill Verification (Requirement 17 & 29)
    // -------------------------------------------------------------
    console.log('[Test 10] Testing CredRAG Full verifySkill Pipeline...');
    const fullReact = await CredRAG.verifySkill(candidateId, resumeAId, 'React');
    console.log(`  - Skill: ${fullReact.skill}`);
    console.log(`  - Verification Level: ${fullReact.verificationLevel}`);
    console.log(`  - Confidence: ${fullReact.confidence}%`);
    console.log(`  - CredRAG Score: ${fullReact.credRagScore}%`);
    console.log(`  - Status: ${fullReact.status}`);
    console.log(`  - Evidence Count: ${fullReact.evidence.length}`);
    console.log(`  - Explanation: "${fullReact.explanation}"`);
    console.log(`  - AI-Verified: ${fullReact.isAiVerified}`);
    if (fullReact.evidence.length === 0 || fullReact.confidence < 60) {
      throw new Error('Full CredRAG verification failed to retrieve sufficient evidence for React.');
    }
    console.log('  ✓ Full CredRAG verifySkill verified.\n');

    // -------------------------------------------------------------
    // Test 11: End-to-End VerificationService Integration (Requirements 18 & 19)
    // -------------------------------------------------------------
    console.log('[Test 11] Testing VerificationService.generateSkillEvidenceMap Integration...');
    const mappedSkills = await VerificationService.generateSkillEvidenceMap(candidateId, resumeAId, sampleAnalysis);
    console.log(`  - Mapped skills count: ${mappedSkills.length}`);
    const reactDoc = await SkillEvidence.findOne({ candidateId, resumeId: resumeAId, skill: 'React' });
    if (!reactDoc) {
      throw new Error('React evidence document not saved in MongoDB.');
    }
    console.log(`  - Stored Skill: ${reactDoc.skill}`);
    console.log(`  - Stored Verification Level: ${reactDoc.verificationLevel}`);
    console.log(`  - Stored Confidence: ${reactDoc.confidence}%`);
    console.log(`  - Stored Evidence Items: ${reactDoc.evidence.length}`);
    console.log(`  - Additive CredRAG Score: ${reactDoc.credRagScore}%`);
    console.log(`  - Additive Diversity Score: ${reactDoc.diversityScore}%`);

    // Check VerificationReport and Resume TrustScore
    const report = await VerificationReport.findOne({ candidateId, resumeId: resumeAId });
    const updatedResume = await Resume.findById(resumeAId);
    console.log(`  - VerificationReport evidenceScore: ${report?.evidenceScore}%`);
    console.log(`  - Resume resumeEvidenceScore: ${updatedResume?.resumeEvidenceScore}%`);
    if (!report || report.evidenceScore <= 0 || !updatedResume?.resumeEvidenceScore) {
      throw new Error('VerificationReport or Resume evidenceScore was not properly updated.');
    }
    console.log('  ✓ VerificationService & TrustScore integration verified.\n');

    // -------------------------------------------------------------
    // Test 12: Run Empirical Ablation Benchmark (Requirements 31 & 32)
    // -------------------------------------------------------------
    console.log('[Test 12] Running Empirical Ablation Study (6 Modes on Real Test Data)...');
    const benchmark = await CredRAGEvaluator.runBenchmark(candidateId, resumeAId, ['React', 'TypeScript', 'Node.js', 'MongoDB']);
    console.log(`\n================================================================`);
    console.log(`  CREDRAG EMPIRICAL ABLATION RESULTS (Real Data Benchmark)     `);
    console.log(`================================================================`);
    console.log(`Evaluated on Resume: ${benchmark.resumeId} (${benchmark.totalResumeChunks} chunks)`);
    console.log(`Skills evaluated: [${benchmark.skillsEvaluated.join(', ')}]\n`);

    console.table(
      benchmark.results.map((r) => ({
        Mode: r.modeName,
        'Latency (ms)': r.avgLatencyMs,
        'Precision@K': r.avgPrecisionAtK,
        'Recall@K': r.avgRecallAtK,
        'F1-Score': r.avgF1Score,
        'Diversity': r.avgDiversityScore,
        'Avg Confidence': `${r.avgConfidence}%`,
        'Strong/Mod/Rev/Unv': `${r.strongCount}/${r.moderateCount}/${r.needsReviewCount}/${r.unverifiedCount}`,
      }))
    );

    console.log('\n================================================================');
    console.log('  ALL 12 CREDRAG TESTS PASSED SUCCESSFULLY!                    ');
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test Suite Failed with Error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

runTestSuite();
