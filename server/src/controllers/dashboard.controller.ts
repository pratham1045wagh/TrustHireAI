import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Resume } from '../models/Resume';
import { Job } from '../models/Job';
import { Application } from '../models/Application';

export class DashboardController {
  public static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (userRole === 'RECRUITER') {
        // Recruiter Dashboard Data
        const recruiterJobs = await Job.find({ recruiterId: userId }).sort({ createdAt: -1 });
        const activeJobsCount = recruiterJobs.filter((j) => j.status === 'PUBLISHED').length;

        const jobIds = recruiterJobs.map((j) => j._id);
        const recruiterApps = await Application.find({ recruiterId: userId })
          .populate('candidateId', 'name email')
          .populate('jobId', 'title companyName location')
          .sort({ appliedAt: -1 });

        const totalApplicantsCount = recruiterApps.length;
        const candidatesReviewedCount = recruiterApps.filter((a) => a.status !== 'APPLIED').length;
        const starredCandidatesCount = recruiterApps.filter((a) => a.isStarred).length;

        // Map active job descriptions with applicant counts
        const activeJobDescriptions = recruiterJobs.slice(0, 5).map((job) => {
          const appCount = recruiterApps.filter((a) => {
            const jId = (a.jobId as any)?._id?.toString() || a.jobId?.toString();
            return jId === job._id.toString();
          }).length;
          return {
            id: job._id,
            title: job.title,
            companyName: job.companyName,
            location: job.location,
            employmentType: job.employmentType,
            status: job.status,
            applicantsCount: appCount,
          };
        });

        // Map recent applicants
        const recentApplicants = recruiterApps.slice(0, 5).map((app) => ({
          id: app._id,
          candidateName: (app.candidateId as any)?.name || 'Candidate',
          candidateEmail: (app.candidateId as any)?.email || '',
          candidateId: (app.candidateId as any)?._id || app.candidateId,
          jobTitle: (app.jobId as any)?.title || 'Job Position',
          status: app.status,
          matchScore: app.matchScore || 0,
          isStarred: app.isStarred || false,
          appliedAt: app.appliedAt,
        }));

        res.status(200).json({
          success: true,
          role: 'RECRUITER',
          stats: {
            activeJobs: activeJobsCount,
            totalApplicants: totalApplicantsCount,
            candidatesReviewed: candidatesReviewedCount,
            starredCandidates: starredCandidatesCount,
          },
          activeJobDescriptions,
          recentApplicants,
        });
        return;
      } else {
        // Candidate Dashboard Data
        const candidateResumes = await Resume.find({ userId }).sort({ createdAt: -1 });
        const totalUploaded = candidateResumes.length;
        const totalAnalyzed = candidateResumes.filter((r) => r.status === 'ANALYZED').length;

        const candidateApps = await Application.find({ candidateId: userId })
          .populate('jobId', 'title companyName location employmentType experienceLevel requiredSkills')
          .sort({ appliedAt: -1 });

        const totalApplications = candidateApps.length;
        const activeApplications = candidateApps.filter((a) => ['APPLIED', 'REVIEWING', 'SHORTLISTED'].includes(a.status)).length;

        // Fetch recommended opportunities (published jobs)
        const publishedJobs = await Job.find({ status: 'PUBLISHED' }).sort({ createdAt: -1 }).limit(4);

        const recommendedJobs = publishedJobs.map((j) => ({
          id: j._id,
          title: j.title,
          companyName: j.companyName,
          location: j.location,
          employmentType: j.employmentType,
          experienceLevel: j.experienceLevel,
          requiredSkills: j.requiredSkills,
        }));

        const recentApplications = candidateApps.slice(0, 5).map((app) => ({
          id: app._id,
          jobTitle: (app.jobId as any)?.title || 'Job Position',
          companyName: (app.jobId as any)?.companyName || 'Company',
          status: app.status,
          matchScore: app.matchScore || 0,
          appliedAt: app.appliedAt,
        }));

        res.status(200).json({
          success: true,
          role: 'CANDIDATE',
          stats: {
            totalUploaded,
            totalAnalyzed,
            totalApplications,
            activeApplications,
          },
          recommendedJobs,
          recentApplications,
        });
        return;
      }
    } catch (error) {
      next(error);
    }
  }
}
