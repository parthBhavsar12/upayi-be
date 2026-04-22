import { Router } from 'express';

const router = Router();

// Bootstrap Route
router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
