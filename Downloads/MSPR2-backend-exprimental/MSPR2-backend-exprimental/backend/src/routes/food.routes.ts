import { Router } from 'express';
import * as foodController from '../controllers/food.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFoodEntrySchema, updateFoodEntrySchema } from '../schemas/food.schema';

const router = Router();
router.use(authMiddleware);

router.get('/daily-summary', foodController.getDailySummaryController);
router.post('/', validate(createFoodEntrySchema), foodController.createFoodEntryController);
router.get('/',  foodController.getFoodEntriesController);
router.get('/:id',    foodController.getFoodEntryByIdController);
router.put('/:id',    validate(updateFoodEntrySchema), foodController.updateFoodEntryController);
router.delete('/:id', foodController.deleteFoodEntryController);

export default router;
