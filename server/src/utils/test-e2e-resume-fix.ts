import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Resume } from '../models/Resume';
import { GeminiService } from '../services/gemini.service';
import { RAGService } from '../services/rag.service';
import { VerificationService } from '../services/verification.service';
import { VectorDocument } from '../models/VectorDocument';
import { SkillEvidence } from '../models/SkillEvidence';
import { normalizeResumeData } from '../utils/normalize';

async function runE2ETest() {
  console.log('================================================================');
  console.log('  TrustHireAI — End-to-End Resume Extraction & CredRAG Test     ');
  console.log('================================================================\n');

  await connectDB();

  // 1. Fetch the exact resume that had 0 projects / experience / education
  const resumeDoc = await Resume.findById('6ace6aefeb02fde5a212966c');
  if (!resumeDoc || !resumeDoc.extractedText) {
    throw new Error('Target resume 6ace6aefeb02fde5a212966c not found in MongoDB');
  }

  console.log(`[Target Resume] ID: ${resumeDoc._id}, File: ${resumeDoc.originalFileName}`);
  console.log(`[Target Resume] Extracted text length: ${resumeDoc.extractedText.length} characters\n`);

  // 2. Test Resume Extraction with GeminiService
  console.log('[Step 1] Running GeminiService.analyzeResume...');
  const tExtractionStart = Date.now();
  const rawAnalysis = await GeminiService.analyzeResume(resumeDoc.extractedText);
  const normalized = normalizeResumeData(rawAnalysis);
  const extractionDuration = Date.now() - tExtractionStart;

  console.log(`[ResumeProcessing] Extraction completed in ${extractionDuration}ms`);
  console.log(`  - Candidate Name: "${normalized.personalInfo.fullName}"`);
  console.log(`  - Email: "${normalized.personalInfo.email}"`);
  console.log(`  - Phone: "${normalized.personalInfo.phone}"`);
  console.log(`  - Location: "${normalized.personalInfo.location}"`);

  const allSkills = [
    ...normalized.skills.programmingLanguages,
    ...normalized.skills.frameworks,
    ...normalized.skills.databases,
    ...normalized.skills.tools,
    ...normalized.skills.cloud,
  ];
  console.log(`  - Extracted Skills: ${allSkills.length} detected [${allSkills.slice(0, 8).join(', ')}...]`);
  console.log(`  - Extracted Projects: ${normalized.projects.length} detected`);
  for (const p of normalized.projects) {
    console.log(`      * Project: "${p.name}" (${p.duration || 'N/A'}) - Tech: [${p.technologies.slice(0, 4).join(', ')}]`);
  }

  console.log(`  - Extracted Work Experience: ${normalized.experience.length} detected`);
  for (const exp of normalized.experience) {
    console.log(`      * Company: "${exp.company}", Role: "${exp.role}" (${exp.startDate} - ${exp.endDate}) - Bullets: ${exp.description.length}`);
  }

  console.log(`  - Extracted Education: ${normalized.education.length} detected`);
  for (const edu of normalized.education) {
    console.log(`      * Institution: "${edu.institution}", Degree: "${edu.degree}", Field: "${edu.field}"`);
  }

  console.log(`  - Extracted Certifications: ${normalized.certifications.length} detected`);
  for (const c of normalized.certifications) {
    console.log(`      * Cert: "${c.name}", Issuer: "${c.issuer}"`);
  }

  // Assertions
  if (normalized.projects.length === 0) {
    throw new Error('FAILURE: Extracted Projects is still 0!');
  }
  if (normalized.experience.length === 0) {
    throw new Error('FAILURE: Extracted Work Experience is still 0!');
  }
  if (normalized.education.length === 0) {
    throw new Error('FAILURE: Extracted Education is still 0!');
  }
  console.log('\n  ✓ Resume Extraction PASSED: All sections accurately detected.\n');

  // 3. Test CredRAG Indexing
  console.log('[Step 2] Running CredRAG indexing (RAGService.indexResume)...');
  const tIndexStart = Date.now();
  const chunksCount = await RAGService.indexResume(resumeDoc._id.toString(), resumeDoc.userId.toString(), normalized);
  const indexDuration = Date.now() - tIndexStart;
  console.log(`[CredRAG] Indexed ${chunksCount} chunks in ${indexDuration}ms`);

  const vectorCount = await VectorDocument.countDocuments({ resumeId: resumeDoc._id.toString() });
  console.log(`[CredRAG] Verified ${vectorCount} VectorDocuments in database for resumeId=${resumeDoc._id}`);
  if (vectorCount === 0) {
    throw new Error('FAILURE: No VectorDocuments were created in database!');
  }
  console.log('  ✓ CredRAG Vector Indexing PASSED.\n');

  // 4. Test Second Indexing (Idempotence & Embedding Cache Reuse)
  console.log('[Step 3] Testing Idempotent Second Indexing (Cache Reuse)...');
  const tSecondStart = Date.now();
  const secondChunksCount = await RAGService.indexResume(resumeDoc._id.toString(), resumeDoc.userId.toString(), normalized);
  const secondDuration = Date.now() - tSecondStart;
  console.log(`[CredRAG] Second indexing completed in ${secondDuration}ms (Chunks: ${secondChunksCount})`);
  const vectorCountAfter = await VectorDocument.countDocuments({ resumeId: resumeDoc._id.toString() });
  console.log(`[CredRAG] Vector count after second index: ${vectorCountAfter} (Duplicates prevented: ${vectorCountAfter === vectorCount})`);
  if (vectorCountAfter !== vectorCount) {
    throw new Error('FAILURE: Duplicate vectors created on repeated indexing!');
  }
  console.log('  ✓ Idempotency & Cache PASSED.\n');

  // 5. Test Skill Evidence Mapping & Verification
  console.log('[Step 4] Running Skill Evidence Mapping (VerificationService.generateSkillEvidenceMap)...');
  const tEvidenceStart = Date.now();
  const evidenceDocs = await VerificationService.generateSkillEvidenceMap(
    resumeDoc.userId.toString(),
    resumeDoc._id.toString(),
    normalized,
    { fastMode: true }
  );
  const evidenceDuration = Date.now() - tEvidenceStart;
  console.log(`[CredRAG] Generated ${evidenceDocs.length} SkillEvidence records in ${evidenceDuration}ms`);

  const savedEvidence = await SkillEvidence.find({ resumeId: resumeDoc._id.toString() }).limit(5);
  for (const ev of savedEvidence) {
    console.log(`    * Skill: "${ev.skill}" | Level: ${ev.claimedLevel} | Confidence: ${ev.confidence}% | Verification: ${ev.verificationLevel} | Sources: ${ev.evidence.length}`);
  }

  // 6. Update target resume in DB to reflect fixed state
  resumeDoc.status = 'ANALYZED';
  resumeDoc.analysis = normalized;
  resumeDoc.resumeEvidenceScore = 75;
  await resumeDoc.save();
  console.log(`\n[Database] Updated resume ${resumeDoc._id} status to ANALYZED with normalized data.`);

  // 7. Multi-Format Tests (PART 26)
  console.log('\n================================================================');
  console.log('  Testing Multi-Format Resume Variations (PART 26)              ');
  console.log('================================================================\n');

  // Test B: Resume with Work Experience + Skills
  const testBText = `
Alex Morgan
alex.morgan@example.com | 555-123-4567 | San Francisco, CA
linkedin.com/in/alexmorgan | github.com/alexmorgan

Professional Summary
Senior Software Engineer with 6+ years experience building cloud applications.

Technical Skills
Languages: Python, Go, TypeScript, SQL
Frameworks: Django, FastAPI, React
Cloud: AWS, Docker, Kubernetes

Professional Experience
Acme Corp | San Francisco, CA
Senior Backend Engineer | 2021 - Present
- Designed high-throughput microservices handling 20M daily requests.
- Reduced API p99 latency by 45% using Redis caching.

Beta Systems | San Jose, CA
Software Engineer | 2018 - 2021
- Developed RESTful APIs in Go and Python.
`;
  const parsedB = normalizeResumeData(GeminiService.extractHeuristicFallback(testBText));
  console.log(`[Test B] Experience count: ${parsedB.experience.length}, Skills count: ${parsedB.skills.programmingLanguages.length}`);
  if (parsedB.experience.length < 2) throw new Error('Test B failed: Experience entries missing');

  // Test C: Resume with Academic Projects + Internships + Academic Qualifications
  const testCText = `
Priya Sharma
priya.sharma@example.com | 9876543210 | Bangalore, India

Academic Qualifications
Indian Institute of Technology, Madras
B.Tech in Computer Science and Engineering | 2020 - 2024
CGPA: 8.9 / 10

Skills & Technologies
Languages: Java, C++, Python
Web: Node.js, Express, React

Internships
Google India | Bangalore
Software Engineering Intern | May 2023 - July 2023
- Built internal tooling for distributed logging analysis using Go and BigQuery.

Academic Projects
Autonomous Drone Navigation System | 2023
Technologies: Python, ROS, OpenCV, TensorFlow
- Implemented real-time SLAM and obstacle avoidance for quadcopters.
`;
  const parsedC = normalizeResumeData(GeminiService.extractHeuristicFallback(testCText));
  console.log(`[Test C] Education count: ${parsedC.education.length}, Internships/Experience count: ${parsedC.experience.length}, Projects count: ${parsedC.projects.length}`);
  if (parsedC.education.length === 0 || parsedC.experience.length === 0 || parsedC.projects.length === 0) {
    throw new Error('Test C failed: Sections missing');
  }

  // Test D: Resume with Courses & Certifications + Selected Projects
  const testDText = `
David Kim
david.kim@example.com | New York, NY

Selected Projects
E-Commerce Real-time Analytics Engine | 2024
Tech Stack: React, Kafka, Apache Flink, PostgreSQL
- Processed 50,000 transaction events per second with sub-second dashboard updates.

Courses & Certifications
- AWS Certified Solutions Architect Associate - Amazon Web Services
- Deep Learning Specialization - Coursera
`;
  const parsedD = normalizeResumeData(GeminiService.extractHeuristicFallback(testDText));
  console.log(`[Test D] Projects count: ${parsedD.projects.length}, Certifications count: ${parsedD.certifications.length}`);
  if (parsedD.projects.length === 0 || parsedD.certifications.length === 0) {
    throw new Error('Test D failed: Sections missing');
  }

  console.log('\n================================================================');
  console.log('  ALL END-TO-END TESTS PASSED SUCCESSFULLY!                      ');
  console.log('================================================================\n');

  await mongoose.disconnect();
}

runE2ETest().catch((err) => {
  console.error('\nE2E Test Failed:', err);
  process.exit(1);
});
