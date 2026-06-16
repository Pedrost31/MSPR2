import { Router } from 'express';
import authRoutes     from './auth.routes';
import userRoutes     from './user.routes';
import foodRoutes     from './food.routes';
import activityRoutes from './activity.routes';
import goalRoutes     from './goal.routes';
import aiRoutes       from './ai.routes';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/users',        userRoutes);
router.use('/food-entries', foodRoutes);
router.use('/activities',   activityRoutes);
router.use('/goals',        goalRoutes);
router.use('/ai',           aiRoutes);

export default router;
