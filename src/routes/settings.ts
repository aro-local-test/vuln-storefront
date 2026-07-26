import { Router, Request, Response } from 'express';
import { SITE_SETTINGS } from '../lib/state';

const router = Router();

function deepMerge(dst: any, src: any): any {
  for (const key in src) {
    const value = src[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!dst[key] || typeof dst[key] !== 'object') {
        dst[key] = {};
      }
      deepMerge(dst[key], value);
    } else {
      dst[key] = value;
    }
  }
  return dst;
}

router.get('/settings', (_req: Request, res: Response) => {
  res.json(SITE_SETTINGS);
});

router.post('/settings', (req: Request, res: Response) => {
  const patch = req.body || {};
  deepMerge(SITE_SETTINGS, patch);
  res.json({ ok: true, settings: SITE_SETTINGS });
});

export default router;
