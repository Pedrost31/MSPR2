import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateUserSchema } from '../schemas/user.schema';

const router = Router();
router.use(authMiddleware);

router.get('/me',    userController.getMeController);
router.put('/me',    validate(updateUserSchema), userController.updateMeController);
router.delete('/me', userController.deleteMeController);

export default router;
