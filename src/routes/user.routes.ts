import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getUserProfile, updateUpiId, changePassword } from '../controllers/user.controller.js';

const router = Router();

router.use(protect);

router.get('/', getUserProfile);
router.put('/upi', updateUpiId);
router.put('/password', changePassword);

export default router;
