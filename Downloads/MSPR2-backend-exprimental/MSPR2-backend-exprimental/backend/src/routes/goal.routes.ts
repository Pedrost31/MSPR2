import { Router } from 'express';
import * as goalController from '../controllers/goal.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateGoalSchema } from '../schemas/goal.schema';

const router = Router();
router.use(authMiddleware);

router.get('/', goalController.getGoalsController);
router.put('/', validate(updateGoalSchema), goalController.updateGoalsController);

export default router;
