import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authenticateToken, requireCandidate, requireRecruiter } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Candidate routes
router.post('/apply', requireCandidate, ApplicationController.applyToJob);
router.get('/my-applications', requireCandidate, ApplicationController.getCandidateApplications);
router.get('/my-applications/:id', requireCandidate, ApplicationController.getCandidateApplicationById);

// Recruiter routes
router.get('/recruiter/applicants', requireRecruiter, ApplicationController.getRecruiterApplicants);
router.get('/recruiter/starred', requireRecruiter, ApplicationController.getStarredCandidates);
router.get('/recruiter/candidates/:candidateId', requireRecruiter, ApplicationController.getCandidateProfileForRecruiter);
router.patch('/recruiter/:id/status', requireRecruiter, ApplicationController.updateApplicationStatus);
router.patch('/recruiter/:id/star', requireRecruiter, ApplicationController.toggleStar);
router.patch('/recruiter/:id/shortlist', requireRecruiter, ApplicationController.toggleShortlist);
router.patch('/recruiter/:id/notes', requireRecruiter, ApplicationController.updateNotes);

export default router;
