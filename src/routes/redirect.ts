import { Router, Request, Response } from 'express';

const router = Router();

router.get('/go', (req: Request, res: Response) => {
  const next = String(req.query.next || '/');
  res.redirect(302, next);
});

export default router;
