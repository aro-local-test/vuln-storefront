import { Router, Request, Response } from 'express';
import { COMMENTS, page } from '../lib/state';

const router = Router();

router.get('/comments', (_req: Request, res: Response) => {
  const items = COMMENTS.map(
    (c) => '<li><b>' + c.author + '</b>: ' + c.body + '</li>',
  ).join('');
  const form =
    '<form method="POST" action="/comments">' +
    '<input name="author" placeholder="name">' +
    '<input name="body" placeholder="comment">' +
    '<button type="submit">Post</button></form>';
  res.type('html');
  res.send(page('Comments', '<h2>Reviews</h2><ul>' + items + '</ul>' + form));
});

router.post('/comments', (req: Request, res: Response) => {
  const author = String(req.body.author || 'anon');
  const body = String(req.body.body || '');
  COMMENTS.push({ id: COMMENTS.length + 1, author, body });
  res.redirect('/comments');
});

export default router;
