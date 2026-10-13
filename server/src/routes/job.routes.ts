import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticateToken, requireRecruiter } from '../middleware/auth.middleware';
import { uploadSingleResume } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

// Candidate & Recruiter can get job details
router.get('/published', JobController.getCandidateJobs);
router.get('/recruiter', requireRecruiter, JobController.getRecruiterJobs);
router.post('/semantic-search', requireRecruiter, JobController.semanticSearch);
router.get('/:id', JobController.getJobById);
router.get('/:id/semantic-candidates', requireRecruiter, JobController.getSemanticCandidates);

// Recruiter routes
router.post('/create', requireRecruiter, uploadSingleResume, JobController.createJob);
router.patch('/:id', requireRecruiter, JobController.updateJob);
router.delete('/:id', requireRecruiter, JobController.deleteJob);

export default router;
