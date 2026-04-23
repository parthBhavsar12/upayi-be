import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { saveTransaction, getTransactions, deleteTransaction } from '../controllers/transaction.controller.js';

const router = Router();

router.use(protect);

router.post('/', saveTransaction);
router.get('/', getTransactions);
router.delete('/:id', deleteTransaction);

export default router;
