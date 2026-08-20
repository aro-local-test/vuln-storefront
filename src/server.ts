import express from 'express';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

import searchRouter from './routes/search';
import commentsRouter from './routes/comments';
import imageProxyRouter from './routes/imageProxy';
import settingsRouter from './routes/settings';
import redirectRouter from './routes/redirect';
import accountRouter from './routes/account';
import { verifySession } from './lib/session';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const ORDERS_API = process.env.ORDERS_API || 'http://orders-api:8000';
const PAYMENTS_SVC = process.env.PAYMENTS_SVC || 'http://payments-svc:9000';
const REPORTS_SVC = process.env.REPORTS_SVC || 'http://127.0.0.1:5000';

// Internal and financial services require an authenticated, non-forgeable session.
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (!verifySession(req.cookies?.session_user)) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  next();
}

app.use(
  '/api/orders',
  requireAuth,
  createProxyMiddleware({
    target: ORDERS_API,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '' },
  }),
);

app.use(
  '/api/pay',
  requireAuth,
  createProxyMiddleware({
    target: PAYMENTS_SVC,
    changeOrigin: true,
    pathRewrite: { '^/api/pay': '' },
  }),
);

app.use('/reports', requireAuth, createProxyMiddleware({ target: REPORTS_SVC, changeOrigin: true }));

app.use(searchRouter);
app.use(commentsRouter);
app.use(imageProxyRouter);
app.use(settingsRouter);
app.use(redirectRouter);
app.use(accountRouter);

app.get('/', (_req, res) => {
  res.type('html').send(
    [
      '<h1>Storefront</h1><ul>',
      '<li><a href="/search?q=shoes">/search</a></li>',
      '<li><a href="/comments">/comments</a></li>',
      '<li><a href="/image-proxy?url=http://example.com/a.png">/image-proxy</a></li>',
      '<li><a href="/settings">/settings</a></li>',
      '<li><a href="/reports?region=eu">/reports</a></li>',
      '</ul>',
    ].join(''),
  );
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`storefront listening on ${PORT}`);
});

export default app;
