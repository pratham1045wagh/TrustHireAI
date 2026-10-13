import { Router } from 'express';
import { ProctoringController } from '../controllers/proctoring.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadProctoringSnapshot } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/events', ProctoringController.logEvent);
router.post('/event', ProctoringController.logEvent);
router.post('/snapshots', uploadProctoringSnapshot, ProctoringController.uploadSnapshot);
router.get('/session/:sessionId', ProctoringController.getSessionTimeline);
router.get('/snapshots/:fileName', ProctoringController.getSnapshotImage);

export default router;
