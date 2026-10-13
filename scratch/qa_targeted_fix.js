const path = require('path');
const mongoose = require(path.resolve(__dirname, '../server/node_modules/mongoose'));

const BASE_URL = 'http://localhost:3000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runQa() {
  console.log('====================================================');
  console.log('RESUMEAI WORKFLOW, RBAC, TRUSTSCORE & VERIFICATION QA');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();

    // 1. Recruiter Registration & RBAC
    console.log('\n--- 1. Testing Recruiter RBAC & Job Creation ---');
    const recruiterEmail = `recruiter_${timestamp}@testcorp.io`;
    const recRegRes = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Sarah Connor',
        email: recruiterEmail,
        password: 'Password123!',
        role: 'RECRUITER',
        companyName: 'Cyberdyne Systems',
      },
    });

    assert(recRegRes.status === 201 && recRegRes.data.success, 'Recruiter registration successful');
    assert(recRegRes.data.token != null, 'Recruiter registration returns JWT token');
    const recToken = recRegRes.data.token;
    const recHeaders = { Authorization: `Bearer ${recToken}` };

    // Test Recruiter Job Creation
    const jobRes = await req('/jobs/create', {
      method: 'POST',
      headers: recHeaders,
      body: {
        title: `Staff Backend Architect ${timestamp}`,
        companyName: 'Cyberdyne Systems',
        location: 'San Francisco, CA',
        employmentType: 'Full Time',
        experienceLevel: '5+ years',
        salaryRange: '$180,000 - $240,000 USD',
        description: 'Lead backend distributed systems architecture and microservices deployment.',
        requiredSkills: ['Node.js', 'TypeScript', 'MongoDB', 'Distributed Systems'],
        preferredSkills: ['Redis', 'Docker', 'Kubernetes'],
        status: 'PUBLISHED',
      },
    });

    assert(jobRes.status === 201 && jobRes.data.success, 'Recruiter successfully created job with NO 403 Access Denied');
    const jobId = jobRes.data.job?.id || jobRes.data.job?._id;
    assert(jobId != null, `Job created with ID: ${jobId}`);

    // 2. Candidate Registration & Resume Upload
    console.log('\n--- 2. Testing Candidate & Resume-Wise Primary Identity ---');
    const candidateEmail = `candidate_${timestamp}@polymath.edu`;
    const candRegRes = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'John Connor',
        email: candidateEmail,
        password: 'Password123!',
        role: 'CANDIDATE',
      },
    });

    assert(candRegRes.status === 201 && candRegRes.data.success, 'Candidate registered successfully');
    const candToken = candRegRes.data.token;
    const candId = candRegRes.data.user.id;
    const candHeaders = { Authorization: `Bearer ${candToken}` };

    // Connect to DB directly for creating realistic test resumes and testing data isolation
    await mongoose.connect('mongodb://127.0.0.1:27017/resume_ai');
    const db = mongoose.connection.db;

    // Create Resume A (Backend focused)
    const resumeAId = new mongoose.Types.ObjectId();
    await db.collection('resumes').insertOne({
      _id: resumeAId,
      userId: new mongoose.Types.ObjectId(candId),
      originalFileName: 'John_Backend_Resume.pdf',
      fileSize: 1048576,
      filePath: 'uploads/sample_backend.pdf',
      status: 'ANALYZED',
      resumeEvidenceScore: 82,
      assessmentPerformanceScore: null,
      consistencyAlignmentScore: null,
      trustScore: null,
      assessmentStatus: 'NOT_TAKEN',
      analysis: {
        personalInfo: { fullName: 'John Connor', email: candidateEmail, phone: '555-0199', location: 'Los Angeles, CA' },
        skills: {
          programmingLanguages: ['Go', 'TypeScript', 'Python'],
          frameworks: ['Express', 'NestJS', 'FastAPI'],
          libraries: ['Mongoose', 'Prisma'],
          databases: ['PostgreSQL', 'MongoDB', 'Redis'],
          cloud: ['AWS', 'Docker'],
          tools: ['Git', 'Postman'],
          other: ['gRPC', 'GraphQL'],
        },
        projects: [
          { name: 'Microservices Gateway', description: 'Engineered high-throughput Go and Node.js proxy with Redis caching', technologies: ['Go', 'Node.js', 'Redis'] }
        ],
        experience: [
          { company: 'Tech Corp', role: 'Senior Backend Engineer', description: ['Built distributed APIs with TypeScript and PostgreSQL'] }
        ],
        education: [{ institution: 'Caltech', degree: 'B.S. Computer Science' }],
        certifications: [{ name: 'AWS Certified Solutions Architect' }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Populate Skill Evidence for Resume A
    await db.collection('skillevidences').insertMany([
      {
        candidateId: new mongoose.Types.ObjectId(candId),
        resumeId: resumeAId,
        skill: 'Go',
        claimedLevel: 'Advanced',
        confidence: 88,
        status: 'EVIDENCE_FOUND',
        evidence: [{ sourceType: 'PROJECT', sourceTitle: 'Microservices Gateway', snippet: 'Engineered high-throughput Go proxy', relevanceScore: 90 }],
        verificationLevel: 'Strong',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        candidateId: new mongoose.Types.ObjectId(candId),
        resumeId: resumeAId,
        skill: 'TypeScript',
        claimedLevel: 'Advanced',
        confidence: 86,
        status: 'EVIDENCE_FOUND',
        evidence: [{ sourceType: 'EXPERIENCE', sourceTitle: 'Tech Corp', snippet: 'Built distributed APIs with TypeScript', relevanceScore: 88 }],
        verificationLevel: 'Strong',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // 3. Test Skill Evidence Endpoint for Resume A
    console.log('\n--- 3. Testing Skill Evidence Mapping (No re-upload required) ---');
    const skillEvRes = await req(`/verification/skills?resumeId=${resumeAId.toString()}`, { headers: candHeaders });
    assert(skillEvRes.status === 200 && skillEvRes.data.success, 'Skill evidence loaded for Resume A');
    assert(skillEvRes.data.skills.length >= 2, `Retrieved ${skillEvRes.data.skills.length} mapped skills for Resume A`);
    assert(skillEvRes.data.skills.some(s => s.skill === 'Go'), 'Skill Go is mapped with project evidence');

    // 4. Test TrustScore BEFORE Assessment for Resume A
    console.log('\n--- 4. Testing TrustScore Before Assessment (Strictly Null / Assessment Required) ---');
    const repResA = await req(`/verification/my-report?resumeId=${resumeAId.toString()}`, { headers: candHeaders });
    assert(repResA.status === 200 && repResA.data.success, 'Report endpoint returned 200');
    assert(repResA.data.report.trustScore === null, 'report.trustScore is STRICTLY null before assessment');
    assert(repResA.data.report.assessmentScore === null, 'report.assessmentScore is null before assessment');

    const resumeScoreResA = await req(`/resumes/${resumeAId.toString()}/trust-score`, { headers: candHeaders });
    assert(resumeScoreResA.data.trustScore === null, 'resumes/:id/trust-score returns trustScore: null');
    assert(resumeScoreResA.data.assessmentStatus === 'NOT_TAKEN', 'resumes/:id/trust-score returns assessmentStatus: NOT_TAKEN');

    // 5. Upload Resume B (Frontend focused)
    console.log('\n--- 5. Testing Multi-Resume Isolation (Resume B) ---');
    const resumeBId = new mongoose.Types.ObjectId();
    await db.collection('resumes').insertOne({
      _id: resumeBId,
      userId: new mongoose.Types.ObjectId(candId),
      originalFileName: 'John_Frontend_Design.pdf',
      fileSize: 850000,
      filePath: 'uploads/sample_frontend.pdf',
      status: 'ANALYZED',
      resumeEvidenceScore: 75,
      assessmentPerformanceScore: null,
      consistencyAlignmentScore: null,
      trustScore: null,
      assessmentStatus: 'NOT_TAKEN',
      analysis: {
        personalInfo: { fullName: 'John Connor', email: candidateEmail },
        skills: {
          programmingLanguages: ['JavaScript', 'HTML5', 'CSS3'],
          frameworks: ['React', 'Next.js', 'Vue.js'],
          libraries: ['TailwindCSS', 'Redux Toolkit'],
          databases: ['Firebase'],
          tools: ['Figma', 'Webpack'],
        },
        projects: [
          { name: 'E-Commerce Frontend', description: 'Created modern user interface in React and Next.js', technologies: ['React', 'Next.js'] }
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Populate Skill Evidence for Resume B
    await db.collection('skillevidences').insertOne({
      candidateId: new mongoose.Types.ObjectId(candId),
      resumeId: resumeBId,
      skill: 'React',
      claimedLevel: 'Advanced',
      confidence: 84,
      status: 'EVIDENCE_FOUND',
      evidence: [{ sourceType: 'PROJECT', sourceTitle: 'E-Commerce Frontend', snippet: 'Created modern user interface in React', relevanceScore: 85 }],
      verificationLevel: 'Strong',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const skillEvResB = await req(`/verification/skills?resumeId=${resumeBId.toString()}`, { headers: candHeaders });
    assert(skillEvResB.data.skills.length >= 1, 'Resume B loaded its own independent skill evidence');
    assert(skillEvResB.data.skills.some(s => s.skill === 'React'), 'Resume B contains React');
    assert(!skillEvResB.data.skills.some(s => s.skill === 'Go'), 'Resume B does NOT leak Resume A skill "Go" (Clean Isolation)');

    // 6. Complete Assessment for Resume A
    console.log('\n--- 6. Testing Assessment Completion & TrustScore Calculation for Resume A ---');
    const sessionIdA = new mongoose.Types.ObjectId();
    const assessmentAId = new mongoose.Types.ObjectId();

    await db.collection('assessments').insertOne({
      _id: assessmentAId,
      candidateId: new mongoose.Types.ObjectId(candId),
      resumeId: resumeAId,
      assessmentType: 'RESUME_BASED',
      title: 'Backend Architecture Verification',
      skills: ['Go', 'TypeScript', 'PostgreSQL'],
      totalQuestions: 20,
      durationMinutes: 30,
      generationStatus: 'READY',
      createdAt: new Date(),
    });

    // Score: 80% on assessment
    // Resume Evidence = 82
    // Assessment Performance = 80
    // Consistency Alignment = 100 - |82 - 80| = 98
    // TrustScore = (82 * 0.30) + (80 * 0.50) + (98 * 0.20) = 24.6 + 40 + 19.6 = 84.2 -> 84%
    await db.collection('assessmentsessions').insertOne({
      _id: sessionIdA,
      assessmentId: assessmentAId,
      candidateId: new mongoose.Types.ObjectId(candId),
      resumeId: resumeAId,
      assessmentType: 'RESUME_BASED',
      status: 'SUBMITTED',
      score: 16,
      totalQuestions: 20,
      percentage: 80,
      correctAnswers: 16,
      incorrectAnswers: 4,
      skippedAnswers: 0,
      skillScores: {
        'Go': { total: 10, correct: 9, percentage: 90 },
        'TypeScript': { total: 10, correct: 7, percentage: 70 },
      },
      submittedAt: new Date(),
      createdAt: new Date(),
    });

    // Update Resume A with completed assessment
    await db.collection('resumes').updateOne(
      { _id: resumeAId },
      {
        $set: {
          assessmentStatus: 'COMPLETED',
          assessmentPerformanceScore: 80,
          consistencyAlignmentScore: 98,
          trustScore: 84,
          latestAssessmentSessionId: sessionIdA,
        }
      }
    );

    // Verify TrustScore endpoint for Resume A
    const resumeScoreAfterA = await req(`/resumes/${resumeAId.toString()}/trust-score`, { headers: candHeaders });
    assert(resumeScoreAfterA.data.assessmentStatus === 'COMPLETED', 'Resume A status is COMPLETED');
    assert(resumeScoreAfterA.data.trustScore === 84, `Resume A TrustScore is verified as 84% (got ${resumeScoreAfterA.data.trustScore}%)`);
    assert(resumeScoreAfterA.data.assessmentPerformance === 80, 'Resume A Assessment Performance is 80%');

    // Verify Resume B has NOT inherited Resume A TrustScore
    const resumeScoreB = await req(`/resumes/${resumeBId.toString()}/trust-score`, { headers: candHeaders });
    assert(resumeScoreB.data.trustScore === null, 'Resume B TrustScore remains STRICTLY NULL (No cross-resume score leakage)');
    assert(resumeScoreB.data.assessmentStatus === 'NOT_TAKEN', 'Resume B assessment status remains NOT_TAKEN');

    // 7. Job Application Flow with Resume A
    console.log('\n--- 7. Testing Job Application Flow & Recruiter TrustScore View ---');
    const applyRes = await req('/applications/apply', {
      method: 'POST',
      headers: candHeaders,
      body: {
        jobId,
        resumeId: resumeAId.toString(),
      },
    });

    assert(applyRes.status === 201 && applyRes.data.success, 'Candidate applied using Resume A');
    const applicationId = applyRes.data.application.id;
    assert(applicationId != null, `Application created: ${applicationId}`);

    // Recruiter views Applicants
    const recApplicantsRes = await req(`/applications/recruiter/applicants?jobId=${jobId}`, { headers: recHeaders });
    assert(recApplicantsRes.status === 200 && recApplicantsRes.data.success, 'Recruiter retrieved applicants');
    const applicantRow = recApplicantsRes.data.applicants.find(a => a.id === applicationId);
    assert(applicantRow != null, 'Application row found in recruiter table');
    assert(applicantRow.trustScore === 84, `Recruiter applicant table displays TrustScore 84% for Resume A (got ${applicantRow.trustScore}%)`);
    assert(applicantRow.assessmentStatus === 'COMPLETED', 'Recruiter applicant table displays Assessment Completed');

    // 8. Recruiter View Candidate Profile with Categorized Skills from Resume A
    console.log('\n--- 8. Testing Recruiter Candidate Profile with Selected Resume ---');
    const profileRes = await req(`/applications/recruiter/candidates/${candId}?applicationId=${applicationId}`, { headers: recHeaders });
    assert(profileRes.status === 200 && profileRes.data.success, 'Recruiter retrieved candidate profile');
    assert(profileRes.data.selectedResume._id.toString() === resumeAId.toString(), 'Candidate profile loaded EXACT applied Resume A');
    assert(profileRes.data.trustScore === 84, 'Candidate profile displays TrustScore 84%');
    assert(profileRes.data.categorizedSkills.programmingLanguages.includes('Go'), 'Categorized skills contains Go from Resume A');
    assert(profileRes.data.categorizedSkills.databases.includes('PostgreSQL'), 'Categorized skills contains PostgreSQL from Resume A');
    assert(!profileRes.data.categorizedSkills.databases.includes('Firebase'), 'Categorized skills does NOT contain Resume B skill "Firebase"');

    // 9. Recruiter Assessment Room & Candidate Invitations
    console.log('\n--- 9. Testing Assessment Room & Invitation-Only Candidate Access ---');
    const roomRes = await req('/assessment-rooms', {
      method: 'POST',
      headers: recHeaders,
      body: {
        jobId,
        title: 'Backend Systems Screening Room',
        topics: 'Distributed Systems, Concurrency, Microservices',
        totalQuestions: 20,
        durationMinutes: 45,
        difficulty: 'HARD',
      },
    });

    assert(roomRes.status === 201 && roomRes.data.success, 'Recruiter created Assessment Room for Job');
    const roomId = roomRes.data.room.id;
    const roomCode = roomRes.data.room.roomCode;
    assert(roomId != null, `Room created with ID: ${roomId} and Code: ${roomCode}`);

    // Candidate checks available rooms BEFORE invitation
    const candRoomsBefore = await req('/assessment-rooms/available', { headers: candHeaders });
    assert(
      !candRoomsBefore.data.rooms.some(r => r.id === roomId),
      'Candidate DOES NOT see room before invitation (Uninvited rooms hidden)'
    );

    // Recruiter invites candidate
    const inviteRes = await req(`/assessment-rooms/${roomId}/invite`, {
      method: 'POST',
      headers: recHeaders,
      body: { candidateIds: [candId] },
    });
    assert(inviteRes.status === 200 && inviteRes.data.success, 'Recruiter successfully invited candidate');

    // Candidate checks available rooms AFTER invitation
    const candRoomsAfter = await req('/assessment-rooms/available', { headers: candHeaders });
    assert(
      candRoomsAfter.data.rooms.some(r => r.id === roomId),
      'Candidate CAN see room after receiving explicit invitation'
    );

    console.log('\n====================================================');
    console.log(`QA TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test execution error:', err.message || err);
    process.exit(1);
  }
}

runQa();
