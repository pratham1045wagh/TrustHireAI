import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/my-report', VerificationController.getMyVerificationReport);
router.get('/candidate/:candidateId', VerificationController.getCandidateVerificationReport);
router.get('/skills/:candidateId?', VerificationController.getSkillEvidenceList);
router.get('/credrag/config', VerificationController.getCredRAGConfig);
router.get('/credrag/benchmark/:resumeId', VerificationController.runCredRAGBenchmark);

export default router;
