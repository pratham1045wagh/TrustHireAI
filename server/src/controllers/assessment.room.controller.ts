import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { AuthRequest } from '../types';
import { AssessmentRoom } from '../models/AssessmentRoom';
import { Assessment } from '../models/Assessment';
import { AssessmentQuestion } from '../models/AssessmentQuestion';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { AssessmentInvitation } from '../models/AssessmentInvitation';
import { DocumentService } from '../services/document.service';
import { AssessmentGenerationService } from '../services/assessment.generation.service';
import { AuditService } from '../services/audit.service';

export class AssessmentRoomController {
  /**
   * Recruiter creates an assessment room with unique room code (via existing assessmentId OR direct AI generation config)
   */
  public static async createRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const {
        assessmentId,
        jobId,
        title,
        description,
        skills,
        topics,
        durationMinutes,
        totalQuestions,
        questionCount,
        difficulty,
        naturalLanguagePrompt,
        expiresInDays,
      } = req.body;

      let assessment: any = null;
      const resolvedQCount = Number(totalQuestions || questionCount) || 20;
      const resolvedDuration = Number(durationMinutes) || 45;
      const resolvedDifficulty = (difficulty || 'MIXED').toUpperCase();

      if (assessmentId) {
        assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
          res.status(404).json({ success: false, message: 'Assessment template not found.' });
          return;
        }
      } else {
        // Direct AI Room creation
        const rawSkills = topics || skills || [];
        const parsedSkills: string[] = Array.isArray(rawSkills)
          ? rawSkills.map((s: string) => String(s).trim()).filter(Boolean)
          : String(rawSkills)
              .split(/[,\n]+/)
              .map((s) => s.trim())
              .filter(Boolean);

        if (!title || parsedSkills.length === 0) {
          res.status(400).json({
            success: false,
            message: 'Assessment Title and at least one Topic/Skill are required.',
          });
          return;
        }

        assessment = await Assessment.create({
          recruiterId,
          assessmentType: 'RECRUITER_ROOM',
          title: title.trim(),
          description: description || '',
          skills: parsedSkills,
          totalQuestions: resolvedQCount,
          generatedCount: 0,
          durationMinutes: resolvedDuration,
          defaultDifficulty: resolvedDifficulty === 'MIXED' ? 'MEDIUM' : resolvedDifficulty,
          dynamicDifficulty: resolvedDifficulty === 'MIXED',
          generationMode: 'AI',
          questionSource: 'GENERATED',
          naturalLanguagePrompt: naturalLanguagePrompt || undefined,
          generationStatus: 'GENERATING',
          isPublic: true,
        });

        // Generate questions now (18s timeout + fallback guarantees no hang)
        await AssessmentGenerationService.generateQuestions(
          assessment._id.toString(),
          parsedSkills,
          resolvedQCount,
          undefined,
          description,
          naturalLanguagePrompt,
          resolvedDifficulty
        );

        assessment = await Assessment.findById(assessment._id);
      }

      // Generate unique human-readable room code like RAI-8X92K
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
      const roomCode = `RAI-${randomSuffix}`;

      const days = Number(expiresInDays) || 14;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const room = await AssessmentRoom.create({
        roomCode,
        assessmentId: assessment._id,
        recruiterId,
        jobId: jobId || undefined,
        title: title || `${assessment.title} Room`,
        description: description || assessment.description || '',
        skills: assessment.skills,
        difficulty: ['EASY', 'MEDIUM', 'HARD', 'MIXED'].includes(resolvedDifficulty)
          ? resolvedDifficulty
          : 'MIXED',
        generationMode: assessment.generationMode || 'AI',
        naturalLanguagePrompt: naturalLanguagePrompt || assessment.naturalLanguagePrompt,
        questionSource: assessment.questionSource === 'UPLOADED_PDF' ? 'UPLOADED_PDF' : 'GENERATED',
        assessmentType: 'RECRUITER_ROOM',
        durationMinutes: durationMinutes || assessment.durationMinutes,
        totalQuestions: totalQuestions || questionCount || assessment.totalQuestions,
        status: 'ACTIVE',
        candidates: [],
        expiresAt,
      });

      if (jobId) {
        await Job.findByIdAndUpdate(jobId, { assessmentRoomId: room._id });
      }

      await AuditService.log({
        userId: recruiterId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ASSESSMENT_CREATED',
        resource: 'AssessmentRoom',
        resourceId: room._id.toString(),
        metadata: {
          roomCode,
          title: room.title,
          jobId: room.jobId,
          generationMode: room.generationMode,
          totalQuestions: room.totalQuestions,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Assessment room created successfully.',
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          description: room.description,
          assessmentId: room.assessmentId,
          jobId: room.jobId,
          skills: room.skills,
          difficulty: room.difficulty,
          generationMode: room.generationMode,
          questionSource: room.questionSource,
          durationMinutes: room.durationMinutes,
          totalQuestions: room.totalQuestions,
          status: room.status,
          expiresAt: room.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter Method B Step 1: Upload and parse a Question PDF for preview
   */
  public static async parseQuestionPdf(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Please upload a valid PDF file containing assessment questions.',
        });
        return;
      }

      let extractedText = '';
      try {
        extractedText = await DocumentService.extractText(file.path, file.originalname);
      } catch (parseErr: any) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(400).json({
          success: false,
          message: parseErr.message || 'Could not extract readable text from the uploaded PDF.',
        });
        return;
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const defaultTopic = String(req.body.defaultTopic || 'General Technical').trim();
      const { questions, missingAnswerKeys } = await AssessmentGenerationService.parseQuestionsFromPdfText(
        extractedText,
        [defaultTopic]
      );

      if (!questions || questions.length === 0) {
        res.status(400).json({
          success: false,
          message:
            'No structured multiple-choice questions were detected in this PDF. Please ensure the PDF contains numbered questions and options (A, B, C, D).',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: missingAnswerKeys
          ? `Detected ${questions.length} question(s). Note: Some questions in the PDF did not include answer keys. Please verify or select answer keys in the preview before publishing.`
          : `Successfully extracted ${questions.length} question(s) with answer keys.`,
        detectedCount: questions.length,
        missingAnswerKeys,
        questions,
      });
    } catch (error: any) {
      console.error('[AssessmentRoomController.parseQuestionPdf Error]', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process Question PDF.',
      });
    }
  }

  /**
   * Recruiter Method B Step 2: Publish Assessment Room from previewed PDF questions
   */
  public static async publishPdfRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const {
        jobId,
        title,
        description,
        topics,
        skills,
        difficulty,
        durationMinutes,
        expiresInDays,
        questions,
      } = req.body;

      if (!title || !Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Assessment Title and at least one valid question are required to publish the room.',
        });
        return;
      }

      // Normalize & verify answer keys are present (never silently invent answer keys)
      const normalizedQuestions = questions.map((q: any) => {
        const opts: string[] = Array.isArray(q.options)
          ? q.options.slice(0, 4).map(String)
          : ['Option A', 'Option B', 'Option C', 'Option D'];
        let ansIdx = -1;
        if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3) {
          ansIdx = q.correctAnswer;
        } else if (typeof q.correctAnswer === 'string' && q.correctAnswer.trim()) {
          const trimmed = q.correctAnswer.trim();
          const matchIdx = opts.findIndex(
            (o) => o.trim().toLowerCase() === trimmed.toLowerCase()
          );
          if (matchIdx !== -1) {
            ansIdx = matchIdx;
          } else if (['a', 'b', 'c', 'd'].includes(trimmed.toLowerCase())) {
            ansIdx = ['a', 'b', 'c', 'd'].indexOf(trimmed.toLowerCase());
          }
        }
        return { ...q, options: opts, resolvedAnswerIndex: ansIdx };
      });

      const missingKeyIndex = normalizedQuestions.findIndex(
        (q: any) => q.resolvedAnswerIndex < 0 || q.resolvedAnswerIndex > 3
      );

      if (missingKeyIndex !== -1) {
        res.status(400).json({
          success: false,
          message: `Question #${
            missingKeyIndex + 1
          } is missing an answer key. Answer keys are required for automatically scored MCQ assessments. Please select the correct option in the preview.`,
        });
        return;
      }

      const rawSkills = topics || skills || [];
      const parsedSkills: string[] = Array.isArray(rawSkills)
        ? rawSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(rawSkills)
            .split(/[,\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);

      const detectedSkills = Array.from(
        new Set([
          ...parsedSkills,
          ...normalizedQuestions.map((q: any) => q.skill || q.topic).filter(Boolean),
        ])
      );
      const finalSkills = detectedSkills.length > 0 ? detectedSkills : ['General Technical'];
      const resolvedDuration = Number(durationMinutes) || 45;
      const resolvedDifficulty = (difficulty || 'MIXED').toUpperCase();

      const assessment = await Assessment.create({
        recruiterId,
        assessmentType: 'RECRUITER_ROOM',
        title: title.trim(),
        description: description || 'Uploaded PDF Question Assessment',
        skills: finalSkills,
        totalQuestions: normalizedQuestions.length,
        generatedCount: normalizedQuestions.length,
        durationMinutes: resolvedDuration,
        defaultDifficulty: resolvedDifficulty === 'MIXED' ? 'MEDIUM' : resolvedDifficulty,
        dynamicDifficulty: false,
        generationMode: 'PDF',
        questionSource: 'UPLOADED_PDF',
        generationStatus: 'READY',
        isPublic: true,
      });

      const questionDocs = normalizedQuestions.map((q: any) => ({
        assessmentId: assessment._id,
        skill: q.skill || q.topic || finalSkills[0],
        topic: q.topic || q.skill || finalSkills[0],
        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(String(q.difficulty).toUpperCase())
          ? String(q.difficulty).toUpperCase()
          : 'MEDIUM',
        question: String(q.question).trim(),
        options: q.options,
        correctAnswer: q.resolvedAnswerIndex,
        explanation: q.explanation || 'Uploaded from recruiter PDF question bank.',
      }));

      await AssessmentQuestion.insertMany(questionDocs);

      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
      const roomCode = `RAI-${randomSuffix}`;
      const days = Number(expiresInDays) || 14;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const room = await AssessmentRoom.create({
        roomCode,
        assessmentId: assessment._id,
        recruiterId,
        jobId: jobId || undefined,
        title: title.trim(),
        description: description || '',
        skills: finalSkills,
        difficulty: ['EASY', 'MEDIUM', 'HARD', 'MIXED'].includes(resolvedDifficulty)
          ? resolvedDifficulty
          : 'MIXED',
        generationMode: 'PDF',
        questionSource: 'UPLOADED_PDF',
        assessmentType: 'RECRUITER_ROOM',
        durationMinutes: resolvedDuration,
        totalQuestions: questions.length,
        status: 'ACTIVE',
        candidates: [],
        expiresAt,
      });

      if (jobId) {
        await Job.findByIdAndUpdate(jobId, { assessmentRoomId: room._id });
      }

      await AuditService.log({
        userId: recruiterId,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ASSESSMENT_CREATED',
        resource: 'AssessmentRoom',
        resourceId: room._id.toString(),
        metadata: {
          roomCode,
          title: room.title,
          jobId: room.jobId,
          generationMode: 'PDF',
          totalQuestions: questions.length,
        },
      });

      res.status(201).json({
        success: true,
        message: 'PDF Question Assessment Room published successfully.',
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          description: room.description,
          assessmentId: room.assessmentId,
          jobId: room.jobId,
          skills: room.skills,
          difficulty: room.difficulty,
          generationMode: room.generationMode,
          questionSource: room.questionSource,
          durationMinutes: room.durationMinutes,
          totalQuestions: room.totalQuestions,
          status: room.status,
          expiresAt: room.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Candidate: List recruiter assessment rooms they have been explicitly invited to (Section 2 of Assessments page)
   */
  public static async getAvailableRooms(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Security check: Only list rooms for which the candidate has received an active invitation
      const invitations = await AssessmentInvitation.find({
        candidateId,
        status: { $in: ['INVITED', 'STARTED', 'COMPLETED'] },
      })
        .populate({
          path: 'assessmentRoomId',
          populate: { path: 'recruiterId', select: 'name companyName email' },
        })
        .populate('jobId', 'title companyName location')
        .sort({ invitedAt: -1 });

      const rooms = invitations
        .filter((inv) => inv.assessmentRoomId && (inv.assessmentRoomId as any).status === 'ACTIVE')
        .map((inv) => {
          const r = inv.assessmentRoomId as any;
          const job = inv.jobId as any;
          const recruiterObj = r.recruiterId;
          const myEntry = r.candidates?.find((c: any) => c.candidateId?.toString() === candidateId);

          return {
            id: r._id,
            roomCode: r.roomCode,
            title: r.title,
            description: r.description,
            assessmentId: r.assessmentId,
            recruiterName: recruiterObj?.companyName || recruiterObj?.name || 'Recruiter',
            jobTitle: job?.title || null,
            jobId: job?._id || r.jobId || null,
            invitationId: inv._id,
            invitationStatus: inv.status,
            skills: r.skills,
            difficulty: r.difficulty || 'MIXED',
            generationMode: r.generationMode || 'AI',
            questionSource: r.questionSource || 'GENERATED',
            durationMinutes: r.durationMinutes,
            totalQuestions: r.totalQuestions,
            status: r.status,
            candidateStatus: myEntry?.status || inv.status,
            candidateScore: myEntry?.score ?? null,
            sessionId: myEntry?.sessionId || null,
            expiresAt: r.expiresAt,
            createdAt: r.createdAt,
          };
        });

      res.status(200).json({
        success: true,
        rooms,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: List assessment rooms created by this recruiter
   */
  public static async getRecruiterRooms(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recruiterId = req.user?.id;
      const query = req.user?.role === 'ADMIN' ? {} : { recruiterId };

      const rooms = await AssessmentRoom.find(query).populate('jobId', 'title companyName').sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        rooms: rooms.map((r: any) => ({
          id: r._id,
          roomCode: r.roomCode,
          title: r.title,
          description: r.description,
          jobId: r.jobId?._id || r.jobId || null,
          jobTitle: r.jobId?.title || null,
          skills: r.skills,
          difficulty: r.difficulty || 'MIXED',
          generationMode: r.generationMode || 'AI',
          questionSource: r.questionSource || 'GENERATED',
          durationMinutes: r.durationMinutes,
          totalQuestions: r.totalQuestions,
          status: r.status,
          candidatesCount: r.candidates.length,
          completedCount: r.candidates.filter((c: any) => c.status === 'COMPLETED').length,
          expiresAt: r.expiresAt,
          createdAt: r.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room details by room ID with live candidate roster
   */
  public static async getRoomById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const room = await AssessmentRoom.findById(id)
        .populate('assessmentId', 'title description totalQuestions durationMinutes skills generationMode questionSource')
        .populate('jobId', 'title companyName location');

      if (!room) {
        res.status(404).json({ success: false, message: 'Assessment room not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          description: room.description,
          assessment: room.assessmentId,
          job: room.jobId,
          skills: room.skills,
          difficulty: room.difficulty || 'MIXED',
          generationMode: room.generationMode || 'AI',
          questionSource: room.questionSource || 'GENERATED',
          durationMinutes: room.durationMinutes,
          totalQuestions: room.totalQuestions,
          status: room.status,
          candidates: room.candidates,
          expiresAt: room.expiresAt,
          createdAt: room.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Look up room by human-friendly room code (e.g. RAI-8X92K)
   * Candidate access is strictly protected: requires an active invitation.
   */
  public static async getRoomByCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = String(req.params.code).trim().toUpperCase();
      const room = await AssessmentRoom.findOne({ roomCode: code, status: 'ACTIVE' });

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Invalid or expired assessment room code. Please verify your code.',
        });
        return;
      }

      if (room.expiresAt && new Date() > room.expiresAt) {
        res.status(410).json({
          success: false,
          message: 'This assessment room has expired.',
        });
        return;
      }

      // Security check for candidates: must be invited
      if (req.user?.role === 'CANDIDATE') {
        const invitation = await AssessmentInvitation.findOne({
          candidateId: req.user.id,
          assessmentRoomId: room._id,
          status: { $in: ['INVITED', 'STARTED', 'COMPLETED'] },
        });

        if (!invitation) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You have not been invited to this assessment room.',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          description: room.description,
          assessmentId: room.assessmentId,
          skills: room.skills,
          difficulty: room.difficulty || 'MIXED',
          generationMode: room.generationMode || 'AI',
          durationMinutes: room.durationMinutes,
          totalQuestions: room.totalQuestions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Candidate joins an assessment room using room code
   * Candidate can start recruiter assessment only if:
   * candidateId matches invitation AND invitation is valid AND candidate has applied.
   */
  public static async joinRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { roomCode } = req.body;

      if (!candidateId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const code = String(roomCode || '').trim().toUpperCase();
      const room = await AssessmentRoom.findOne({ roomCode: code, status: 'ACTIVE' });

      if (!room) {
        res.status(404).json({ success: false, message: 'Assessment room not found with this code.' });
        return;
      }

      // Candidate authorization enforcement
      if (req.user?.role === 'CANDIDATE') {
        const invitation = await AssessmentInvitation.findOne({
          candidateId,
          assessmentRoomId: room._id,
          status: { $in: ['INVITED', 'STARTED'] },
        });

        if (!invitation) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You have not been invited to this assessment room, or your invitation has expired.',
          });
          return;
        }

        invitation.status = 'STARTED';
        invitation.startedAt = invitation.startedAt || new Date();
        await invitation.save();

        if (invitation.applicationId) {
          await Application.findByIdAndUpdate(invitation.applicationId, {
            invitationStatus: 'STARTED',
          });
        }
      }

      const candidateUser = await User.findById(candidateId);
      if (!candidateUser) {
        res.status(404).json({ success: false, message: 'Candidate user not found.' });
        return;
      }

      // Check if already in candidate list
      const existingCandidate = room.candidates.find((c) => c.candidateId.toString() === candidateId);

      if (!existingCandidate) {
        room.candidates.push({
          candidateId,
          name: candidateUser.name,
          email: candidateUser.email,
          status: 'NOT_STARTED',
        });
        await room.save();
      }

      res.status(200).json({
        success: true,
        message: 'Successfully joined assessment room.',
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          description: room.description,
          assessmentId: room.assessmentId,
          skills: room.skills,
          difficulty: room.difficulty || 'MIXED',
          generationMode: room.generationMode || 'AI',
          durationMinutes: room.durationMinutes,
          totalQuestions: room.totalQuestions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Invite candidates (starred, shortlisted, or specific candidates) to an assessment room
   */
  public static async inviteCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const recruiterId = req.user?.id;
      const { candidateIds, applicationIds, inviteType } = req.body; // inviteType: 'STARRED' | 'SHORTLISTED' | 'MANUAL'

      const room = await AssessmentRoom.findById(id);
      if (!room || (req.user?.role !== 'ADMIN' && room.recruiterId.toString() !== recruiterId)) {
        res.status(403).json({ success: false, message: 'Assessment room not found or unauthorized.' });
        return;
      }

      let applicationsToInvite: any[] = [];

      if (inviteType === 'STARRED') {
        const query: any = { recruiterId, isStarred: true };
        if (room.jobId) query.jobId = room.jobId;
        applicationsToInvite = await Application.find(query).populate('candidateId', 'name email');
      } else if (inviteType === 'SHORTLISTED') {
        const query: any = {
          recruiterId,
          $or: [{ isShortlisted: true }, { status: 'SHORTLISTED' }],
        };
        if (room.jobId) query.jobId = room.jobId;
        applicationsToInvite = await Application.find(query).populate('candidateId', 'name email');
      } else if (Array.isArray(applicationIds) && applicationIds.length > 0) {
        applicationsToInvite = await Application.find({
          _id: { $in: applicationIds },
          recruiterId,
        }).populate('candidateId', 'name email');
      } else if (Array.isArray(candidateIds) && candidateIds.length > 0) {
        const query: any = {
          candidateId: { $in: candidateIds },
          recruiterId,
        };
        if (room.jobId) query.jobId = room.jobId;
        applicationsToInvite = await Application.find(query).populate('candidateId', 'name email');
      }

      if (applicationsToInvite.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No eligible candidates found matching the selected filter.',
        });
        return;
      }

      const invitedList: any[] = [];

      for (const app of applicationsToInvite) {
        const cId = (app.candidateId as any)?._id?.toString() || app.candidateId?.toString();
        const candidateUser = app.candidateId as any;

        const invitation = await AssessmentInvitation.findOneAndUpdate(
          { candidateId: cId, assessmentRoomId: room._id },
          {
            candidateId: cId,
            applicationId: app._id,
            jobId: room.jobId || app.jobId,
            assessmentRoomId: room._id,
            invitedBy: recruiterId,
            status: 'INVITED',
            invitedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        app.invitationStatus = 'INVITED';
        app.assessmentInvitationId = invitation._id;
        await app.save();

        // Also add candidate to room.candidates if not already present
        const existingInRoom = room.candidates.find((c) => c.candidateId.toString() === cId);
        if (!existingInRoom && candidateUser?.name) {
          room.candidates.push({
            candidateId: cId,
            name: candidateUser.name,
            email: candidateUser.email || '',
            status: 'NOT_STARTED',
          });
        }

        invitedList.push({
          candidateId: cId,
          candidateName: candidateUser?.name,
          applicationId: app._id,
          invitationId: invitation._id,
        });
      }

      await room.save();

      res.status(200).json({
        success: true,
        message: `Successfully invited ${invitedList.length} candidate(s) to this assessment room.`,
        invitedCount: invitedList.length,
        invitedCandidates: invitedList,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Get candidates eligible for invitation to this room
   */
  public static async getRoomEligibleCandidates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const recruiterId = req.user?.id;

      const room = await AssessmentRoom.findById(id);
      if (!room || (req.user?.role !== 'ADMIN' && room.recruiterId.toString() !== recruiterId)) {
        res.status(403).json({ success: false, message: 'Assessment room not found or unauthorized.' });
        return;
      }

      const query: any = { recruiterId };
      if (room.jobId) query.jobId = room.jobId;

      const applications = await Application.find(query)
        .populate('candidateId', 'name email')
        .populate('resumeId', 'originalFileName trustScore')
        .populate('jobId', 'title');

      const invitations = await AssessmentInvitation.find({ assessmentRoomId: room._id });
      const invitedMap = new Map<string, string>();
      for (const inv of invitations) {
        invitedMap.set(inv.candidateId.toString(), inv.status);
      }

      const candidates = applications.map((app: any) => ({
        applicationId: app._id,
        candidateId: app.candidateId?._id || app.candidateId,
        candidateName: app.candidateId?.name || 'Applicant',
        candidateEmail: app.candidateId?.email || '',
        jobTitle: app.jobId?.title || '',
        resumeName: app.resumeId?.originalFileName || 'Resume',
        trustScore: app.resumeId?.trustScore ?? null,
        isStarred: app.isStarred || false,
        isShortlisted: app.isShortlisted || app.status === 'SHORTLISTED',
        invitationStatus: invitedMap.get((app.candidateId?._id || app.candidateId).toString()) || app.invitationStatus || 'NOT_INVITED',
      }));

      res.status(200).json({
        success: true,
        candidates,
      });
    } catch (error) {
      next(error);
    }
  }
}
