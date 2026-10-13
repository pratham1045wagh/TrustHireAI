import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Assessment } from '../models/Assessment';
import { AssessmentRoom } from '../models/AssessmentRoom';
import { AssessmentGenerationService } from '../services/assessment.generation.service';

export const seedDemoUsers = async (): Promise<void> => {
  try {
    const candidateEmail = 'candidate@resumeai.com';
    const recruiterEmail = 'recruiter@techcorp.com';
    const adminEmail = 'admin@resumeai.com';

    let candidate = await User.findOne({ email: candidateEmail });
    if (!candidate) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password123', salt);

      candidate = await User.create({
        name: 'Alex Johnson',
        email: candidateEmail,
        passwordHash,
        role: 'CANDIDATE',
        isActive: true,
      });
      console.log('[Seed] Demo candidate created: candidate@resumeai.com / Password123');
    }

    let recruiter = await User.findOne({ email: recruiterEmail });
    if (!recruiter) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password123', salt);

      recruiter = await User.create({
        name: 'Sarah Miller',
        email: recruiterEmail,
        passwordHash,
        role: 'RECRUITER',
        companyName: 'TechCorp Innovations',
        isActive: true,
      });
      console.log('[Seed] Demo recruiter created: recruiter@techcorp.com / Password123');
    }

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password123', salt);

      admin = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        companyName: 'ResumeAI Core Team',
        isActive: true,
      });
      console.log('[Seed] Demo admin created: admin@resumeai.com / Password123');
    }

    // Seed Sample Job Descriptions if none exist for recruiter
    const existingJobs = await Job.find({ recruiterId: recruiter._id });
    if (existingJobs.length === 0) {
      await Job.create([
        {
          recruiterId: recruiter._id,
          title: 'Full Stack Developer',
          companyName: 'TechCorp Innovations',
          location: 'Pune, Maharashtra',
          employmentType: 'Full Time',
          experienceLevel: '0–2 years',
          salaryRange: '$80,000 - $110,000',
          description:
            'We are seeking a talented Full Stack Developer to build modern web applications and REST APIs using React, Node.js, and MongoDB.',
          requiredSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
          preferredSkills: ['TypeScript', 'AWS', 'Docker'],
          responsibilities: [
            'Develop responsive frontend UI components in React and Tailwind CSS.',
            'Design scalable Express Node.js microservices and RESTful API endpoints.',
            'Collaborate with product management and engineering teams.',
          ],
          status: 'PUBLISHED',
        },
        {
          recruiterId: recruiter._id,
          title: 'Data Analyst',
          companyName: 'TechCorp Innovations',
          location: 'Remote',
          employmentType: 'Full Time',
          experienceLevel: '1–3 years',
          salaryRange: '$75,000 - $95,000',
          description:
            'Join our data intelligence unit to analyze customer behavioral trends, construct SQL data pipelines, and visualize metrics.',
          requiredSkills: ['Python', 'SQL', 'Pandas', 'Tableau'],
          preferredSkills: ['PostgreSQL', 'Machine Learning', 'BigQuery'],
          responsibilities: [
            'Extract data from multi-relational SQL databases.',
            'Construct automated executive performance dashboards.',
          ],
          status: 'PUBLISHED',
        },
      ]);
      console.log('[Seed] Sample job descriptions seeded for recruiter.');
    }

    // Seed Sample Assessment Template and Room
    const existingAssessment = await Assessment.findOne({ title: 'Full Stack Engineer Technical Screening' });
    let assessmentDoc = existingAssessment;
    if (!existingAssessment) {
      assessmentDoc = await Assessment.create({
        recruiterId: recruiter._id,
        title: 'Full Stack Engineer Technical Screening',
        description: 'Comprehensive screening assessing core competencies in React, Node.js, and MongoDB.',
        skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
        totalQuestions: 20,
        durationMinutes: 45,
        defaultDifficulty: 'MEDIUM',
        dynamicDifficulty: true,
        generationStatus: 'GENERATING',
        isPublic: true,
      });

      // Generate question bank
      await AssessmentGenerationService.generateQuestions(
        assessmentDoc._id.toString(),
        assessmentDoc.skills,
        assessmentDoc.totalQuestions
      );
      console.log('[Seed] Demo assessment and questions generated.');
    }

    const existingRoom = await AssessmentRoom.findOne({ roomCode: 'RAI-DEMO1' });
    if (!existingRoom && assessmentDoc) {
      await AssessmentRoom.create({
        roomCode: 'RAI-DEMO1',
        assessmentId: assessmentDoc._id,
        recruiterId: recruiter._id,
        title: 'Frontend & Full Stack Screening Room',
        skills: assessmentDoc.skills,
        durationMinutes: assessmentDoc.durationMinutes,
        totalQuestions: assessmentDoc.totalQuestions,
        status: 'ACTIVE',
        candidates: [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      console.log('[Seed] Demo Assessment Room RAI-DEMO1 ready.');
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed demo data:', error);
  }
};
