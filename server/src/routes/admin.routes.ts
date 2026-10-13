import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.toggleUserStatus);
router.get('/jobs', AdminController.getJobs);
router.get('/resumes', AdminController.getResumes);
router.get('/assessments', AdminController.getAssessments);
router.get('/proctoring', AdminController.getProctoringData);
router.get('/vector-db', AdminController.getVectorDbStatus);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/ai-usage', AdminController.getAiUsage);

export default router;
