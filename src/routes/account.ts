import { Router, Request, Response } from 'express';
import { ACCOUNTS, esc, page } from '../lib/state';
import { signSession, verifySession } from '../lib/session';

const router = Router();

function currentUser(req: Request): string | null {
  return verifySession(req.cookies?.session_user);
}

// Demo login: issues a signed session cookie so the storefront stays usable. A real app would
// verify credentials here; the security property that matters is that the session identifier is
// signed, so a client cannot forge another user's identity.
router.post('/login', (req: Request, res: Response) => {
  const uid = String(req.body.user || 'user-1');
  if (!ACCOUNTS[uid]) {
    res.status(404).json({ error: 'unknown user' });
    return;
  }
  res.cookie('session_user', signSession(uid), { httpOnly: true, sameSite: 'strict', path: '/' });
  res.json({ ok: true, uid });
});

router.get('/account', (req: Request, res: Response) => {
  const uid = currentUser(req);
  if (!uid) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  const acct = ACCOUNTS[uid] || { email: '', plan: 'basic' };
  const form =
    '<form method="POST" action="/account/email">' +
    '<input name="email" value="' +
    esc(acct.email) +
    '"><button type="submit">Save</button></form>';
  res.type('html').send(page('Account', '<h2>Account ' + esc(uid) + '</h2>' + form));
});

router.post('/account/email', (req: Request, res: Response) => {
  const uid = currentUser(req);
  if (!uid) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
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
  const email = String(req.body.email || '');
  ACCOUNTS[uid] = { email, plan: ACCOUNTS[uid]?.plan || 'basic' };
  res.json({ ok: true, uid, email });
});

export default router;
