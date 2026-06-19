import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createActivitySchema, updateActivitySchema } from '../schemas/activity.schema';

const router = Router();
router.use(authMiddleware);

router.get('/weekly-summary', activityController.getWeeklySummaryController);
router.post('/', validate(createActivitySchema), activityController.createActivityController);
router.get('/',  activityController.getActivitiesController);
router.get('/:id',    activityController.getActivityByIdController);
router.put('/:id',    validate(updateActivitySchema), activityController.updateActivityController);
router.delete('/:id', activityController.deleteActivityController);

export default router;
