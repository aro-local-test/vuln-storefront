import { Router, Request, Response } from 'express';
import http from 'http';
import https from 'https';

const router = Router();

router.get('/image-proxy', (req: Request, res: Response) => {
  const target = String(req.query.url || '');
  if (!target) {
    res.status(400).json({ error: 'url required' });
    return;
  }

  const client = target.startsWith('https:') ? https : http;
  const upstream = client.get(target, (r) => {
    res.status(r.statusCode || 502);
    res.setHeader('content-type', r.headers['content-type'] || 'application/octet-stream');
    r.pipe(res);
  });

  upstream.on('error', (err: Error) => {
    res.status(502).json({ error: 'fetch failed', detail: err.message, url: target });
  });
});

export default router;
