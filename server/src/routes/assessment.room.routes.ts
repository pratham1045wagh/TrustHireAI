import { Router } from 'express';
import { AssessmentRoomController } from '../controllers/assessment.room.controller';
import { authenticateToken, requireRecruiter } from '../middleware/auth.middleware';
import { uploadQuestionPdf } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRecruiter, AssessmentRoomController.createRoom);
router.post('/parse-pdf', requireRecruiter, uploadQuestionPdf, AssessmentRoomController.parseQuestionPdf);
router.post('/publish-pdf', requireRecruiter, AssessmentRoomController.publishPdfRoom);
router.get('/available', AssessmentRoomController.getAvailableRooms);
router.get('/recruiter', requireRecruiter, AssessmentRoomController.getRecruiterRooms);
router.get('/code/:code', AssessmentRoomController.getRoomByCode);
router.post('/join', AssessmentRoomController.joinRoom);
router.post('/:id/invite', requireRecruiter, AssessmentRoomController.inviteCandidates);
router.get('/:id/invitees', requireRecruiter, AssessmentRoomController.getRoomEligibleCandidates);
router.get('/:id', AssessmentRoomController.getRoomById);

export default router;
