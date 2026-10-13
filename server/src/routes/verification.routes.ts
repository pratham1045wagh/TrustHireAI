import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/my-report', VerificationController.getMyVerificationReport);
router.get('/candidate/:candidateId', VerificationController.getCandidateVerificationReport);
router.get('/skills/:candidateId?', VerificationController.getSkillEvidenceList);

export default router;
