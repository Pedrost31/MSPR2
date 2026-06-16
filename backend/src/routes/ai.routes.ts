import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const aiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de requêtes IA, réessayez dans une heure' },
});

router.post('/recommend', aiLimit, aiController.getRecommendationController);
router.get('/history',    aiController.getRecommendationHistoryController);

export default router;
