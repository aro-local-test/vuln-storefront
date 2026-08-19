import { Router, Request, Response } from 'express';
import { ACCOUNTS, esc, page } from '../lib/state';

const router = Router();

function currentUser(req: Request): string {
  return String(req.cookies?.session_user || 'user-1');
}

router.get('/account', (req: Request, res: Response) => {
  const uid = currentUser(req);
  const acct = ACCOUNTS[uid] || { email: '', plan: 'basic' };
  const form =
    '<form method="POST" action="/account/email">' +
    '<input name="email" value="' +
    esc(acct.email) +
    '"><button type="submit">Save</button></form>';
  res.type('html').send(page('Account', '<h2>Account ' + esc(uid) + '</h2>' + form));
});

router.post('/account/email', (req: Request, res: Response) => {
  const origin = req.get('origin');
  if (origin) {
    let originHost = 'invalid';
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = 'invalid';
    }
    if (originHost !== req.get('host')) {
      res.status(403).json({ error: 'cross-origin request blocked' });
      return;
    }
  }
  const uid = currentUser(req);
  const email = String(req.body.email || '');
  ACCOUNTS[uid] = { email, plan: ACCOUNTS[uid]?.plan || 'basic' };
  res.json({ ok: true, uid, email });
});

export default router;
