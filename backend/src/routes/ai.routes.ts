import { Router, json } from 'express';
import rateLimit from 'express-rate-limit';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const aiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Trop de requêtes IA, réessayez dans une heure' },
});

router.post('/recommend', aiLimit, aiController.getRecommendationController);
router.get('/history',    aiController.getRecommendationHistoryController);

// Les images encodées en base64 dépassent largement la limite JSON globale (10kb)
router.post(
  '/analyze-food-image',
  aiLimit,
  json({ limit: '12mb' }),
  aiController.analyzeFoodImageController,
);

// ── Recettes (API 2) ────────────────────────────────────────────────────────
router.get('/recipes/suggest',   aiLimit, aiController.getRecipeSuggestionsController);
router.post('/recipes/generate', aiLimit, aiController.generateRecipeController);

// ── Diète (API 3) ───────────────────────────────────────────────────────────
router.get('/diet/macros',  aiController.getDietMacrosController);
router.get('/diet/plan',    aiLimit, aiController.getDietPlanController);
router.get('/diet/analyze', aiLimit, aiController.getDietAnalysisController);

// ── Entraînement (API 4) ────────────────────────────────────────────────────
router.get('/training/program',       aiLimit, aiController.getTrainingProgramController);
router.post('/training/quick-workout', aiLimit, aiController.getQuickWorkoutController);

export default router;
