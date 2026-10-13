import mongoose from 'mongoose';
import { Resume } from '../models/Resume';
import { SkillEvidence, ISkillEvidenceDocument } from '../models/SkillEvidence';
import { VerificationReport, IVerificationReportDocument } from '../models/VerificationReport';
import { AssessmentSession } from '../models/AssessmentSession';
import { IResumeAnalysis, ISkillEvidence, SkillProficiencyLevel, SkillVerificationStatus } from '../types';
import { RAGService } from './rag.service';

export class VerificationService {
  /**
   * Generates skill evidence mapping for all extracted resume skills (strictly resume-isolated)
   */
  public static async generateSkillEvidenceMap(
    candidateId: string,
    resumeId: string,
    analysis: IResumeAnalysis
  ): Promise<ISkillEvidenceDocument[]> {
    if (!candidateId || !resumeId) return [];

    // Collect all skills from this resume
    const allSkills = Array.from(
      new Set([
        ...(analysis.skills?.programmingLanguages || []),
        ...(analysis.skills?.frameworks || []),
        ...(analysis.skills?.libraries || []),
        ...(analysis.skills?.databases || []),
        ...(analysis.skills?.tools || []),
        ...(analysis.skills?.cloud || []),
        ...(analysis.skills?.other || []),
      ])
    ).filter(Boolean);

    const savedItems: ISkillEvidenceDocument[] = [];

    for (const skill of allSkills) {
      const evidenceList: ISkillEvidence[] = [];

      // Check projects in this resume
      if (analysis.projects) {
        for (const proj of analysis.projects) {
          const inTechs = (proj.technologies || []).some((t) =>
            t.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(t.toLowerCase())
          );
          const inDesc = (proj.description || '').toLowerCase().includes(skill.toLowerCase());

          if (inTechs || inDesc) {
            evidenceList.push({
              sourceType: 'PROJECT',
              sourceTitle: proj.name || 'Project',
              snippet: `${proj.role || 'Contributor'}: ${proj.description || ''}`,
              relevanceScore: inTechs ? 90 : 80,
            });
          }
        }
      }

      // Check experience in this resume
      if (analysis.experience) {
        for (const exp of analysis.experience) {
          const inDesc = (exp.description || []).some((d) =>
            d.toLowerCase().includes(skill.toLowerCase())
          );
          if (inDesc) {
            evidenceList.push({
              sourceType: 'EXPERIENCE',
              sourceTitle: `${exp.role || 'Role'} at ${exp.company || 'Company'}`,
              snippet: (exp.description || []).join(' '),
              relevanceScore: 85,
            });
          }
        }
      }

      // Check certifications in this resume
      if (analysis.certifications) {
        for (const cert of analysis.certifications) {
          if ((cert.name || '').toLowerCase().includes(skill.toLowerCase())) {
            evidenceList.push({
              sourceType: 'CERTIFICATION',
              sourceTitle: cert.name || 'Certification',
              snippet: `Issued by ${cert.issuer || 'Issuer'} (${cert.date || ''})`,
              relevanceScore: 95,
            });
          }
        }
      }

      // Inquire vector DB for semantic evidence if direct text match is empty
      if (evidenceList.length === 0) {
        try {
          const ragEvidence = await RAGService.searchResumeEvidence(candidateId, skill, 2);
          for (const r of ragEvidence) {
            if (r.similarity > 70) {
              evidenceList.push({
                sourceType: r.section === 'projects' ? 'PROJECT' : 'EXPERIENCE',
                sourceTitle: `Resume ${r.section}`,
                snippet: r.text.slice(0, 150),
                relevanceScore: Math.round(r.similarity),
              });
            }
          }
        } catch {
          // ignore RAG search errors
        }
      }

      // Determine claimed level & status
      let claimedLevel: SkillProficiencyLevel = 'Intermediate';
      let confidence = 65;
      let status: SkillVerificationStatus = 'CLAIMED';
      let verificationLevel: 'Strong' | 'Moderate' | 'Needs Review' | 'Unverified' = 'Unverified';

      if (evidenceList.length >= 2) {
        claimedLevel = 'Advanced';
        confidence = Math.min(96, 75 + evidenceList.length * 6);
        status = 'EVIDENCE_FOUND';
        verificationLevel = 'Strong';
      } else if (evidenceList.length === 1) {
        claimedLevel = 'Intermediate';
        confidence = 75;
        status = 'PARTIALLY_SUPPORTED';
        verificationLevel = 'Moderate';
      } else {
        claimedLevel = 'Beginner';
        confidence = 50;
        status = 'NEEDS_ASSESSMENT';
        verificationLevel = 'Unverified';
      }

      const item = await SkillEvidence.findOneAndUpdate(
        { candidateId, resumeId, skill },
        {
          candidateId,
          resumeId,
          skill,
          claimedLevel,
          confidence,
          status,
          evidence: evidenceList,
          verificationLevel,
          notes: `${evidenceList.length} evidence source(s) mapped from resume.`,
        },
        { upsert: true, new: true }
      );

      savedItems.push(item);
    }

    // Refresh resume-specific TrustScore & Verification Report
    await this.calculateVerificationScore(candidateId, resumeId);

    return savedItems;
  }

  /**
   * Calculate transparent, resume-isolated TrustScore:
   * TrustScore = (Resume Evidence * 30%) + (Assessment Performance * 50%) + (Consistency Alignment * 20%)
   * If assessment is not taken yet, TrustScore is null (Not Available)
   */
  public static async calculateVerificationScore(
    candidateId: string,
    resumeId: string
  ): Promise<IVerificationReportDocument> {
    let validResumeId = resumeId;
    if (!validResumeId || !mongoose.isValidObjectId(validResumeId)) {
      const existingResume = await Resume.findOne({ userId: candidateId }).sort({ createdAt: -1 });
      if (existingResume) {
        validResumeId = existingResume._id.toString();
      }
    }

    // Load skills strictly associated with this resume
    const skillItems = await SkillEvidence.find({
      candidateId,
      ...(validResumeId ? { resumeId: validResumeId } : {}),
    });

    // 1. Evidence Score (30%)
    let evidenceScore = 60;
    if (skillItems.length > 0) {
      const sumConf = skillItems.reduce((acc, curr) => acc + curr.confidence, 0);
      evidenceScore = Math.round(sumConf / skillItems.length);
    }

    // 2. Assessment Score (50%) strictly from completed session for THIS specific resume
    const sessionQuery: any = {
      candidateId,
      status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    };
    if (validResumeId) {
      sessionQuery.resumeId = validResumeId;
    }

    const latestSession = await AssessmentSession.findOne(sessionQuery).sort({ submittedAt: -1 });

    const hasAssessment = !!latestSession;
    let assessmentScore: number | null = null;
    let consistencyScore: number | null = null;
    let trustScore: number | null = null;
    let overallScore: number = evidenceScore;

    if (hasAssessment && latestSession) {
      const perf = Math.round(latestSession.percentage);
      assessmentScore = perf;
      const diff = Math.abs(evidenceScore - perf);
      consistencyScore = Math.max(0, 100 - diff);
      // TrustScore = Evidence(30%) + Assessment(50%) + Consistency(20%)
      trustScore = Math.round(
        evidenceScore * 0.3 + assessmentScore * 0.5 + consistencyScore * 0.2
      );
      trustScore = Math.min(100, Math.max(0, trustScore));
      overallScore = trustScore;
    } else {
      // Assessment not taken yet -> TrustScore is strictly Not Available (null)
      trustScore = null;
      assessmentScore = null;
      consistencyScore = null;
      overallScore = evidenceScore;
    }

    // Positive factors and limitations
    const positiveFactors: string[] = [];
    const limitations: string[] = [];

    const strongSkills = skillItems.filter((s) => s.verificationLevel === 'Strong').map((s) => s.skill);
    if (strongSkills.length > 0) {
      positiveFactors.push(`Strong project and experience evidence identified for: ${strongSkills.slice(0, 4).join(', ')}.`);
    }

    if (hasAssessment && assessmentScore !== null) {
      if (assessmentScore >= 75) {
        positiveFactors.push(`High assessment accuracy demonstrated (${assessmentScore}% score across evaluated technical competencies).`);
      } else {
        limitations.push(`Assessment performance (${assessmentScore}%) was lower than self-reported resume proficiency.`);
      }
    } else {
      limitations.push('Standardized technical assessment has not yet been completed for this resume.');
    }

    const unverifiedSkills = skillItems.filter((s) => s.evidence.length === 0).map((s) => s.skill);
    if (unverifiedSkills.length > 0) {
      limitations.push(`Skills listed without verifiable project or experience context: ${unverifiedSkills.slice(0, 3).join(', ')}.`);
    }

    const summary = hasAssessment && trustScore !== null
      ? `Candidate holds an overall TrustScore of ${trustScore}%, supported by verified resume evidence and objective assessment results.`
      : `Resume evidence score is ${evidenceScore}%. TrustScore will be calculated once the candidate completes the proctored assessment for this resume.`;

    const updateDoc: any = {
      candidateId,
      overallScore,
      trustScore,
      evidenceScore,
      assessmentScore,
      consistencyScore,
      positiveFactors,
      limitations,
      summary,
    };

    if (validResumeId) {
      updateDoc.resumeId = validResumeId;
    }

    // Upsert VerificationReport for this specific resume
    const reportQuery: any = { candidateId };
    if (validResumeId) {
      reportQuery.resumeId = validResumeId;
    }

    const report = await VerificationReport.findOneAndUpdate(
      reportQuery,
      updateDoc,
      { upsert: true, new: true }
    );

    // Update the Resume model fields directly
    if (validResumeId) {
      await Resume.findByIdAndUpdate(validResumeId, {
        resumeEvidenceScore: evidenceScore,
        assessmentPerformanceScore: assessmentScore,
        consistencyAlignmentScore: consistencyScore,
        trustScore,
        assessmentStatus: hasAssessment ? 'COMPLETED' : 'NOT_TAKEN',
        latestAssessmentSessionId: latestSession?._id || null,
      });
    }

    return report;
  }

  /**
   * Integrate Assessment Session results into Skill Evidence, Resume record, and Verification Report
   */
  public static async updateWithAssessment(session: any): Promise<void> {
    const { candidateId, resumeId, skillScores } = session;

    if (skillScores) {
      for (const [skill, stats] of Object.entries(skillScores as Record<string, { total: number; correct: number; percentage: number }>)) {
        const percentage = stats.percentage;
        let verificationLevel: 'Strong' | 'Moderate' | 'Needs Review' = 'Moderate';
        let status: SkillVerificationStatus = 'VERIFIED';

        if (percentage >= 75) {
          verificationLevel = 'Strong';
          status = 'VERIFIED';
        } else if (percentage >= 55) {
          verificationLevel = 'Moderate';
          status = 'VERIFIED';
        } else {
          verificationLevel = 'Needs Review';
          status = 'NEEDS_REVIEW';
        }

        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query: any = { candidateId, skill: new RegExp(`^${escapedSkill}$`, 'i') };
        if (resumeId) {
          query.resumeId = resumeId;
        }

        await SkillEvidence.findOneAndUpdate(
          query,
          {
            assessmentScore: percentage,
            verificationLevel,
            status,
            notes: `Verified via proctored assessment: ${stats.correct}/${stats.total} correct (${percentage}%).`,
          }
        );
      }
    }

    await this.calculateVerificationScore(candidateId, resumeId || '');
  }
}
