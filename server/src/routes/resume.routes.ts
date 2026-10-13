import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadSingleResume } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', uploadSingleResume, ResumeController.uploadResume);
router.get('/', ResumeController.getResumes);
router.get('/:id', ResumeController.getResumeById);
router.get('/:id/evidence', ResumeController.getResumeEvidence);
router.get('/:id/trust-score', ResumeController.getResumeTrustScore);
router.get('/:id/download', ResumeController.downloadResumeFile);
router.post('/:id/retry', ResumeController.retryAnalysis);
router.delete('/:id', ResumeController.deleteResume);

export default router;
