import { Router, Request, Response } from 'express';
import http from 'http';
import https from 'https';
import dns from 'dns/promises';
import net from 'net';

const router = Router();

function isBlockedAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local and cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  const low = ip.toLowerCase();
  return low === '::1' || low === '::' || low.startsWith('fe80') || low.startsWith('fc') || low.startsWith('fd');
}

router.get('/image-proxy', async (req: Request, res: Response) => {
  const target = String(req.query.url || '');
  if (!target) {
    res.status(400).json({ error: 'url required' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    res.status(400).json({ error: 'invalid url' });
    return;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'unsupported scheme' });
    return;
  }

  let resolved;
  try {
    resolved = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    res.status(400).json({ error: 'host resolution failed' });
    return;
  }
  if (resolved.some((a) => isBlockedAddress(a.address))) {
    res.status(403).json({ error: 'destination host is not allowed' });
    return;
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const upstream = client.get(target, (r) => {
    res.status(r.statusCode || 502);
    res.setHeader('content-type', r.headers['content-type'] || 'application/octet-stream');
    r.pipe(res);
  });

  upstream.on('error', (err: Error) => {
    res.status(502).json({ error: 'fetch failed', detail: err.message });
  });
});

export default router;
