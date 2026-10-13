import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Resume } from '../models/Resume';
import { Assessment } from '../models/Assessment';
import { AssessmentSession } from '../models/AssessmentSession';
import { AssessmentRoom } from '../models/AssessmentRoom';
import { ProctoringEvent } from '../models/ProctoringEvent';
import { AuditLog } from '../models/AuditLog';
import { VectorStoreService } from '../services/vector.store.service';
import { AuditService } from '../services/audit.service';

export class AdminController {
  /**
   * System Overview Statistics for Admin Dashboard
   */
  public static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        candidatesCount,
        recruitersCount,
        jobsCount,
        resumesCount,
        assessmentsCount,
        sessionsCount,
        proctoringEventsCount,
        vectorDbStatus,
        recentLogs,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'CANDIDATE' }),
        User.countDocuments({ role: 'RECRUITER' }),
        Job.countDocuments(),
        Resume.countDocuments(),
        Assessment.countDocuments(),
        AssessmentSession.countDocuments(),
        ProctoringEvent.countDocuments(),
        VectorStoreService.getStatus(),
        AuditLog.find().sort({ timestamp: -1 }).limit(8).lean(),
      ]);

      res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          candidatesCount,
          recruitersCount,
          jobsCount,
          resumesCount,
          assessmentsCount,
          sessionsCount,
          proctoringEventsCount,
        },
        vectorDbStatus,
        recentLogs,
        systemHealth: {
          apiStatus: 'ONLINE',
          databaseStatus: 'CONNECTED',
          vectorDbStatus: 'OPERATIONAL',
          geminiStatus: 'CONFIGURED',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all registered users with filter and pagination
   */
  public static async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, search } = req.query;
      const query: any = {};

      if (role) query.role = role;
      if (search) {
        query.$or = [
          { name: new RegExp(String(search), 'i') },
          { email: new RegExp(String(search), 'i') },
        ];
      }

      const users = await User.find(query)
        .select('_id name email role companyName isActive createdAt')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        users: users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          companyName: u.companyName,
          isActive: u.isActive !== false,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user active/inactive status
   */
  public static async toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      user.isActive = !user.isActive;
      await user.save();

      await AuditService.log({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'ADMIN_ACTION',
        resource: 'User',
        resourceId: id,
        metadata: { action: 'TOGGLE_STATUS', newStatus: user.isActive },
      });

      res.status(200).json({
        success: true,
        message: `User status updated to ${user.isActive ? 'Active' : 'Inactive'}.`,
        isActive: user.isActive,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all jobs
   */
  public static async getJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await Job.find().populate('recruiterId', 'name email').sort({ createdAt: -1 });
      res.status(200).json({ success: true, jobs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all resumes
   */
  public static async getResumes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resumes = await Resume.find().populate('userId', 'name email').sort({ createdAt: -1 });
      res.status(200).json({ success: true, resumes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all assessments and assessment rooms
   */
  public static async getAssessments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessments = await Assessment.find().sort({ createdAt: -1 });
      const rooms = await AssessmentRoom.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        assessments,
        rooms,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all proctoring sessions and recent events
   */
  public static async getProctoringData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await AssessmentSession.find({
        status: { $in: ['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED'] },
      })
        .populate('candidateId', 'name email')
        .populate('assessmentId', 'title')
        .sort({ createdAt: -1 })
        .limit(50);

      const recentEvents = await ProctoringEvent.find()
        .populate('candidateId', 'name email')
        .sort({ timestamp: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        sessions,
        recentEvents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vector database detailed status
   */
  public static async getVectorDbStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await VectorStoreService.getStatus();
      res.status(200).json({ success: true, status });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs
   */
  public static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
      res.status(200).json({ success: true, logs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AI Usage overview
   */
  public static async getAiUsage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resumesAnalyzed = await Resume.countDocuments({ status: 'ANALYZED' });
      const questionsGenerated = await AssessmentSession.countDocuments();
      const vectorDocs = await VectorStoreService.getStatus();

      res.status(200).json({
        success: true,
        metrics: {
          configuredModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          resumesAnalyzed,
          assessmentsConducted: questionsGenerated,
          embeddingsCount: vectorDocs.totalDocuments,
          geminiHealth: 'ACTIVE',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
