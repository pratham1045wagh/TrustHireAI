import { Router } from 'express';
import { AssessmentSessionController } from '../controllers/assessment.session.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/start', AssessmentSessionController.startSession);
router.get('/my-sessions', AssessmentSessionController.getMySessions);
router.post('/:id/answer', AssessmentSessionController.answerQuestion);
router.post('/:id/submit', AssessmentSessionController.submitSession);
router.get('/:id/status', AssessmentSessionController.getSessionStatus);
router.get('/:id/report', AssessmentSessionController.getSessionReport);

export default router;
