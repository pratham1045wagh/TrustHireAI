import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticateToken, requireRecruiter } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', AssessmentController.getAssessments);
router.get('/my-resume-assessments', AssessmentController.getMyResumeAssessments);
router.post('/resume/:resumeId/create', AssessmentController.createResumeAssessment);
router.post('/', requireRecruiter, AssessmentController.createAssessment);
router.get('/:id', AssessmentController.getAssessmentById);
router.post('/:id/generate', AssessmentController.generateQuestions);
router.get('/:id/questions', AssessmentController.getQuestions);
router.delete('/:id', requireRecruiter, AssessmentController.deleteAssessment);

export default router;
