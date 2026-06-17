import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), authController.registerController);
router.post('/login',    validate(loginSchema),    authController.loginController);
router.post('/refresh',  validate(refreshTokenSchema), authController.refreshController);
router.post('/logout', validate(refreshTokenSchema), authController.logoutController);

export default router;
