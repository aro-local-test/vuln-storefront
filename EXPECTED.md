# vuln-storefront — expected findings

Public front door. TypeScript (Express) + a small Python Flask blueprint mounted behind the Express
reverse proxy at `/reports`. Two findings-capable languages: TypeScript (~66%), Python (~31%).

Reverse-proxy routes: `/api/orders/*` -> `http://orders-api:8000`, `/api/pay/*` -> `http://payments-svc:9000`.

## Planted vulnerabilities

| file:line | CWE | Shannon category | SAST should detect | HTTP-exploitable | expected-dropped-as-OTHER |
|---|---|---|---|---|---|
| src/routes/search.ts:25 | CWE-79 (reflected XSS) | XSS | yes | yes — `GET /search?q=<script>alert(1)</script>` | no |
| src/routes/comments.ts:16 | CWE-79 (stored XSS) | XSS | yes | yes — `POST /comments` body=`<img src=x onerror=alert(1)>`, renders on `GET /comments` | no |
| src/routes/imageProxy.ts:15 | CWE-918 (SSRF) | SSRF | yes | yes — `GET /image-proxy?url=http://169.254.169.254/latest/meta-data/` | no |
| src/routes/settings.ts:15 | CWE-1321 (prototype pollution) | INJECTION | yes | yes — `POST /settings` `{"__proto__":{"polluted":"yes"}}` | no |
| src/routes/redirect.ts:7 | CWE-601 (open redirect) | OTHER | yes | yes — `GET /go?next=https://evil.example.com` (302) | yes |
| src/routes/account.ts:21 | CWE-352 (CSRF, state-changing POST, no token) | OTHER | yes | yes — cross-origin `POST /account/email` mutates the account | yes |
| src/py/reports.py:37 | CWE-89 (SQL injection, `.format()` into SELECT) | INJECTION | yes | yes — `GET /reports/revenue?region=eu%27%20OR%20%271%27%3D%271&sort=1--` | no |
| src/utils/db.py:12 | CWE-89 (SQL injection, `%`-formatted SELECT) | INJECTION | yes | yes — `GET /reports?region=eu%27%20OR%20%271%27%3D%271` | no |

Sink lines above are the `execute`/`send`/`redirect` call; the tainted string is built on the
immediately preceding line in each Python case (`src/py/reports.py:34`, `src/utils/db.py:11`).

## Traps

**Cross-repo provenance collision.** `src/utils/db.py:12` is a CWE-89 sink at that exact path and line, deliberately matching vuln-orders-api/src/utils/db.py:12, and
line. `vuln-orders-api` plants the same path (`src/utils/db.py`), the same CWE (CWE-89), and the same
line (26) on purpose. Findings from the two repos must not be deduplicated or attributed to a single
provenance; each must stay bound to its own repository.

**Unsupported languages.** `mobile/StoreWidget.swift` and `mobile/store_badge.dart` are never
imported by any entrypoint and contain no vulnerability. They must never be offered for enrichment
and must not appear as findings-capable languages.

| file | language | expectation |
|---|---|---|
| mobile/StoreWidget.swift | Swift | never offered for enrichment; no findings |
| mobile/store_badge.dart | Dart | never offered for enrichment; no findings |

## Deliberately clean

`src/lib/state.ts` `esc()` is a real escaper and is applied in `src/routes/account.ts` (lines 16, 18)
so that route's only expected finding is the CSRF one. `src/routes/search.ts:30` (`/search.json`) is
JSON-encoded and is not an XSS. The `matches()` and `esc()` regexes are linear — no CWE-1333.
