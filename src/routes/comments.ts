import { Router, Request, Response } from 'express';
import { COMMENTS, page, esc } from '../lib/state';
import { requireAuth } from '../lib/auth';

const router = Router();

router.get('/comments', (_req: Request, res: Response) => {
  const items = COMMENTS.map(
    (c) => '<li><b>' + esc(c.author) + '</b>: ' + esc(c.body) + '</li>',
  ).join('');
  const form =
    '<form method="POST" action="/comments">' +
    '<input name="body" placeholder="comment">' +
    '<button type="submit">Post</button></form>';
  res.type('html');
  res.send(page('Comments', '<h2>Reviews</h2><ul>' + items + '</ul>' + form));
});

router.post('/comments', requireAuth, (req: Request, res: Response) => {
  // Attribute the comment to the authenticated user; never trust a client-supplied author.
  const author = (req as Request & { uid?: string }).uid as string;
  const body = String(req.body.body || '');
  COMMENTS.push({ id: COMMENTS.length + 1, author, body });
  res.redirect('/comments');
});

export default router;
