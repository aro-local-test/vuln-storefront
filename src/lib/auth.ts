import { Request, Response, NextFunction } from 'express';
import { verifySession } from './session';
import { ACCOUNTS } from './state';

type AuthedRequest = Request & { uid?: string };

/** Require a valid, non-forgeable session. Attaches the user id to the request. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const uid = verifySession(req.cookies?.session_user);
  if (!uid) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  (req as AuthedRequest).uid = uid;
  next();
}

/** Require a valid session whose account holds the admin role. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const uid = verifySession(req.cookies?.session_user);
  if (!uid) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  if (ACCOUNTS[uid]?.role !== 'admin') {
    res.status(403).json({ error: 'administrator role required' });
    return;
  }
  (req as AuthedRequest).uid = uid;
  next();
}
