# OpsPulse AI — Security Architecture & Threat Model

> This document covers every known attack vector, the mitigations in place, and the steps required before publishing to enterprise clients handling confidential operational data.

---

## 1. Threat Model — Attack Scenarios

### 1.1 Network-Level Attacks

| Attack | Risk | Mitigation |
|--------|------|------------|
| **DDoS / volumetric flood** | High | Rate limiting (60 req/min per IP on API, 20/min on `/api/simulate`). Vercel's edge network absorbs volumetric floods. Add Cloudflare in front for enterprise. |
| **Slow Loris** | Medium | Vercel serverless functions have a 10s timeout by default. No persistent connections to exhaust. |
| **HTTP request smuggling** | Low | Vercel's edge proxy normalises all requests before they reach the app. |
| **TLS downgrade / MITM** | High | HSTS header enforced (`max-age=63072000; includeSubDomains; preload`). All traffic forced to HTTPS on Vercel. |
| **DNS hijacking** | Medium | Use Vercel's managed DNS + DNSSEC. Enable HSTS preload list submission. |

### 1.2 Application-Level Attacks

| Attack | Risk | Mitigation |
|--------|------|------------|
| **SQL Injection** | High | Supabase uses parameterised queries. Zod validates all inputs before they reach the DB layer. |
| **XSS (Cross-Site Scripting)** | High | Content Security Policy blocks inline scripts from unknown sources. React escapes all rendered values by default. `sanitizeString()` in `lib/security.ts` strips HTML/JS from string inputs. |
| **CSRF (Cross-Site Request Forgery)** | Medium | API routes require `Content-Type: application/json`. SameSite cookie policy (when auth is added). CORS blocks unknown origins. |
| **Clickjacking** | High | `X-Frame-Options: DENY` + `frame-ancestors 'none'` in CSP. |
| **MIME sniffing** | Medium | `X-Content-Type-Options: nosniff` on all responses. |
| **Open redirect** | Low | No user-controlled redirect targets in the app. |
| **Path traversal** | Low | Next.js App Router has no dynamic file serving. No `fs.readFile` with user input. |
| **Prototype pollution** | Medium | Zod schema validation rejects unexpected fields. No `Object.assign` with raw user input. |
| **ReDoS (Regex DoS)** | Low | No complex user-controlled regex. Zod uses safe built-in validators. |
| **Server-Side Request Forgery (SSRF)** | Low | No user-controlled URLs are fetched server-side. Supabase URL is env-var only. |

### 1.3 Authentication & Authorisation Attacks

| Attack | Risk | Mitigation |
|--------|------|------------|
| **Unauthenticated API access** | Critical | `API_SECRET_KEY` env var enables Bearer token / X-API-Key auth on all `/api/*` routes via middleware. |
| **Brute-force API key** | High | Rate limiting (5 req/min for auth endpoints). Timing-safe comparison prevents timing attacks. |
| **JWT forgery** | Medium | When Supabase Auth is enabled, JWTs are verified server-side using Supabase's public key. |
| **Session fixation** | Low | No server-side sessions currently. Stateless API key auth. |
| **Privilege escalation** | Medium | Row-Level Security (RLS) in Supabase restricts data access per authenticated user. |

### 1.4 Data Exposure Attacks

| Attack | Risk | Mitigation |
|--------|------|------------|
| **Sensitive data in error messages** | High | `safeErrorResponse()` in `lib/security.ts` never exposes stack traces or internal details to clients. |
| **Sensitive data in logs** | High | Audit logs never include API keys, passwords, or PII. |
| **Sensitive data in client bundle** | Critical | All secrets use server-only env vars (no `NEXT_PUBLIC_` prefix). Supabase service role key is never sent to the browser. |
| **Data leakage via headers** | Medium | `X-Powered-By` removed. Server fingerprinting suppressed. |
| **Cache poisoning** | Medium | `Cache-Control: no-store` on all API responses. |
| **Cross-origin data theft** | High | CORS policy restricts to `ALLOWED_ORIGINS`. `Cross-Origin-Resource-Policy: same-origin`. |

### 1.5 Infrastructure & Supply Chain Attacks

| Attack | Risk | Mitigation |
|--------|------|------------|
| **Dependency compromise (npm)** | High | Pin exact versions in `package.json`. Run `npm audit` regularly. Use Dependabot/Renovate. |
| **Environment variable leakage** | Critical | `.env.local` in `.gitignore`. Vercel encrypts env vars at rest. Never log env vars. |
| **Build-time secret injection** | High | Only `NEXT_PUBLIC_*` vars are bundled. All secrets are runtime-only. |
| **Vercel deployment hijack** | Medium | Enable Vercel SSO + 2FA. Restrict deployment access to specific GitHub branches. |
| **Supabase credential theft** | Critical | Use anon key (public) for client. Service role key only in server-side env vars. Enable Supabase RLS. |

---

## 2. Security Controls Implemented

### 2.1 Edge Middleware (`middleware.ts`)
Runs on **every** `/api/*` request before it reaches route handlers:

```
Request → [CORS check] → [Body size check] → [Rate limit] → [API key auth] → Route Handler
```

- **CORS**: Blocks requests from non-allowlisted origins
- **Body size**: Rejects payloads > 64 KB (prevents memory exhaustion)
- **Rate limiting**: 60 req/min (API), 20 req/min (simulate) per IP
- **API key auth**: Bearer token or X-API-Key header validation
- **Timing-safe comparison**: Prevents timing attacks on key comparison

### 2.2 Security Headers (`next.config.js`)
Applied to **all** routes:

| Header | Value | Protects Against |
|--------|-------|-----------------|
| `Content-Security-Policy` | Strict allowlist | XSS, data injection |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | TLS downgrade, MITM |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | Disables camera, mic, geolocation, etc. | Feature abuse |
| `Cross-Origin-Opener-Policy` | `same-origin` | Cross-origin timing attacks |
| `Cross-Origin-Resource-Policy` | `same-origin` | Cross-origin embedding |

### 2.3 Input Validation (`lib/security.ts` + Zod)
- All API inputs validated with Zod schemas before processing
- `sanitizeString()` strips HTML tags, JS protocols, event handlers
- `isSafeIdentifier()` validates IDs against safe character allowlist
- Body size enforced at middleware level before JSON parsing

### 2.4 Audit Logging (`lib/security.ts`)
Structured JSON logs for every:
- API request (IP, path, method, rate-limit remaining)
- Rate limit violation
- Auth failure
- Oversized payload rejection
- CORS violation

On Vercel: visible in **Functions → Logs** tab.
In production: pipe to Datadog, Splunk, or AWS CloudWatch.

### 2.5 Error Handling
- `safeErrorResponse()` ensures stack traces never reach clients
- Generic error messages in production
- Full error details logged server-side only

---

## 3. Downtime Scenarios & Resilience

### 3.1 Supabase Outage
**Risk**: Database unavailable → app crashes  
**Mitigation**: `lib/supabase.ts` detects missing credentials and falls back to synthetic mock data. The app remains fully functional in demo mode.

### 3.2 Vercel Cold Start Latency
**Risk**: First request after idle period is slow (500ms–2s)  
**Mitigation**: 
- Keep functions warm with Vercel's "Always On" (Pro plan)
- Use `export const dynamic = "force-dynamic"` only where needed
- Static pages pre-rendered where possible

### 3.3 Memory Leak in Rate Limiter
**Risk**: In-memory Map grows unbounded → OOM crash  
**Mitigation**: `cleanupStaleEntries()` runs every 5 minutes, removing entries older than 2× the window. Vercel serverless instances also restart periodically.

### 3.4 Unhandled Promise Rejection
**Risk**: Crashes the serverless function  
**Mitigation**: All async route handlers wrapped in try/catch. `safeErrorResponse()` returns 500 without crashing.

### 3.5 Build Failure on Vercel
**Risk**: Bad deployment breaks production  
**Mitigation**:
- TypeScript errors fail the build (`ignoreBuildErrors: false`)
- ESLint errors fail the build (`ignoreDuringBuilds: false`)
- Use Vercel's preview deployments to test before promoting to production

### 3.6 Environment Variable Missing
**Risk**: App starts without required config → silent failures  
**Mitigation**: `NEXT_PUBLIC_USE_MOCK_DATA=true` ensures the app works without Supabase. Add startup validation (see Section 5).

---

## 4. Pre-Production Checklist

Before publishing to enterprise clients:

### Authentication
- [ ] Set `API_SECRET_KEY` to a cryptographically random 32-byte hex string
- [ ] Enable Supabase Auth (email/password or SSO via SAML/OIDC)
- [ ] Implement Row-Level Security (RLS) policies in Supabase
- [ ] Add session management (Supabase Auth handles this)
- [ ] Enable MFA for admin accounts

### Data Protection
- [ ] Enable Supabase database encryption at rest (enabled by default on paid plans)
- [ ] Enable Supabase Point-in-Time Recovery (PITR) for backups
- [ ] Set `NEXT_PUBLIC_USE_MOCK_DATA=false` and connect real Supabase
- [ ] Audit all `NEXT_PUBLIC_*` env vars — ensure no secrets are exposed
- [ ] Enable Supabase audit logs

### Network Security
- [ ] Set `ALLOWED_ORIGINS` to your exact production domain(s)
- [ ] Add Cloudflare in front of Vercel for WAF + DDoS protection
- [ ] Submit domain to HSTS preload list: https://hstspreload.org
- [ ] Enable Vercel's DDoS protection (automatic on Pro/Enterprise)

### Rate Limiting (Production Upgrade)
- [ ] Replace in-memory rate limiter with Upstash Redis for global coordination:
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  ```
  Then update `middleware.ts` to use `@upstash/ratelimit`.

### Monitoring
- [ ] Add Sentry for error tracking (`SENTRY_DSN` env var)
- [ ] Set up Vercel Log Drains to ship logs to your SIEM
- [ ] Configure uptime monitoring (Better Uptime, Pingdom, etc.)
- [ ] Set up alerts for rate limit spikes (indicates attack)

### Compliance (if handling EU/UK data)
- [ ] Add Privacy Policy and Cookie Policy pages
- [ ] Implement GDPR data deletion endpoint
- [ ] Review Supabase's data processing agreement (DPA)
- [ ] Ensure data residency requirements are met (Supabase region selection)

### Penetration Testing
- [ ] Run OWASP ZAP scan against staging environment
- [ ] Run `npm audit` and fix all high/critical vulnerabilities
- [ ] Review Vercel security advisories
- [ ] Commission third-party pen test before enterprise launch

---

## 5. Generating a Secure API Key

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Set the output as `API_SECRET_KEY` in Vercel environment variables.

---

## 6. Supabase Row-Level Security (RLS) Setup

Run these SQL policies in your Supabase SQL editor to restrict data access:

```sql
-- Enable RLS on all tables
ALTER TABLE ops_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their organisation's data only
CREATE POLICY "org_isolation_ops_metrics"
  ON ops_metrics FOR SELECT
  USING (auth.jwt() ->> 'org_id' = org_id::text);

-- Allow service role full access (for seed scripts)
CREATE POLICY "service_role_full_access"
  ON ops_metrics FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 7. Reporting Security Vulnerabilities

If you discover a security vulnerability in OpsPulse AI:

1. **Do NOT** open a public GitHub issue
2. Email: security@yourcompany.com
3. Include: description, reproduction steps, impact assessment
4. Expected response time: 48 hours
5. We follow responsible disclosure — fixes shipped within 14 days of confirmation

---

## 8. Security Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `zod` | Input validation | ^3.22.4 |
| `@supabase/supabase-js` | DB client with built-in auth | ^2.39.3 |
| Next.js middleware | Edge-level request filtering | 14.1.0 |

**No additional security packages are required** for the current threat model. The implementation uses native Web APIs and Next.js built-ins to minimise the attack surface from third-party dependencies.

---

*Last reviewed: 2024 — Review quarterly or after any significant architecture change.*
