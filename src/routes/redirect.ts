import { Router, Request, Response } from 'express';

const router = Router();

router.get('/go', (req: Request, res: Response) => {
  const next = String(req.query.next || '/');
  // Only allow same-site relative paths; reject absolute and protocol-relative URLs.
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  res.redirect(302, safe);
});

export default router;
