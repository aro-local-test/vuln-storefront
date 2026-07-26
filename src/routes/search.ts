import { Router, Request, Response } from 'express';
import { CATALOG, page } from '../lib/state';

const router = Router();

function matches(name: string, term: string): boolean {
  return name.toLowerCase().includes(term.toLowerCase());
}

router.get('/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  const hits = CATALOG.filter((p) => matches(p.name, q));
  const rows = hits.map((p) => `<li>${p.name} &mdash; $${p.price}</li>`).join('');
  const body =
    '<h2>Results for ' +
    q +
    '</h2><p>' +
    hits.length +
    ' items matched the term "' +
    q +
    '".</p><ul>' +
    rows +
    '</ul>';
  res.type('html');
  res.send(page('Search', body));
});

router.get('/search.json', (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  res.json({ q, hits: CATALOG.filter((p) => matches(p.name, q)) });
});

export default router;
