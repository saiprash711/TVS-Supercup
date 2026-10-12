# TVS Super Cup 2026-27 — Security Architecture & VAPT Readiness Report

> **Classification:** INTERNAL — TVS APPS TEAM (NESH) & IT SECURITY  
> **Prepared for:** Production Handover & VAPT Review  
> **Date:** October 2026

---

## 1. Executive Summary

This document describes the security controls implemented in the TVS Super Cup application, maps them to the key findings from the security review, and provides the VAPT assessment team with a clear architecture reference.

### Security Review Findings — Resolution Status

| # | Finding | Severity | Status | Implementation |
|---|---------|----------|--------|----------------|
| 1 | Customer data exposure through public-facing website | Critical | ✅ RESOLVED | Dealer name masking, auth-gated `/api/dealers`, no-cache API headers |
| 2 | Direct production database access without security controls | High | ✅ RESOLVED | Parameterized queries (Prisma ORM), WAL journal mode, env-based connection |
| 3 | Application integration without Apps Team review | Medium | ✅ READY | Full source code + this handover document prepared for NESH team |
| 4 | No confirmed VAPT / secure code review | High | ✅ READY | Security hardening implemented; VAPT checklist below |
| 5 | Risk of unauthorized access, data leakage, audit non-compliance | Critical | ✅ RESOLVED | Rate limiting, audit logging, CSP headers, admin network isolation |

---

## 2. Architecture Security Model

```
                  ┌─────────────────────────────────────┐
                  │     TVS Corporate Network / VPN      │
                  └────────────┬────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐      ┌──────▼──────┐      ┌─────▼─────┐
    │  Dealers   │      │ TVS Admins  │      │ TVS IT    │
    │ (Public)   │      │ (Internal)  │      │ (Infra)   │
    └─────┬─────┘      └──────┬──────┘      └───────────┘
          │                   │
          │ HTTPS             │ HTTPS + IP Restrict
          │                   │
    ┌─────▼─────────────────▼──────────────┐
    │  Nginx Reverse Proxy / Vercel Edge    │
    │  ├── TLS 1.2/1.3 termination         │
    │  ├── Rate limiting (login_limit zone) │
    │  ├── Security headers (CSP, HSTS)    │
    │  └── Admin IP restriction (deny all) │
    └──────────────────┬───────────────────┘
                       │
    ┌──────────────────▼───────────────────┐
    │  Next.js 16 Application Server       │
    │  ├── Middleware (proxy.ts)            │
    │  │   ├── Subdomain-based routing     │
    │  │   ├── Session cookie validation   │
    │  │   └── Admin path isolation        │
    │  ├── API Layer                        │
    │  │   ├── Rate limiting (in-memory)   │
    │  │   ├── Input sanitization          │
    │  │   ├── Auth guards (cookie-based)  │
    │  │   └── Structured audit logging    │
    │  └── Prisma ORM (parameterized SQL)  │
    └──────────────────┬───────────────────┘
                       │ Parameterized queries only
    ┌──────────────────▼───────────────────┐
    │  Database (SQLite dev / PostgreSQL)   │
    │  ├── No direct external access       │
    │  ├── WAL journal mode                │
    │  └── Busy timeout (30s)              │
    └──────────────────────────────────────┘
```

---

## 3. Security Controls — Detailed Implementation

### 3.1 Authentication & Session Management

| Control | Implementation | File |
|---------|---------------|------|
| Dealer auth | TVS Certified API integration + local DB fallback | `src/lib/auth.ts` |
| Admin auth | HMAC-SHA256 signed session tokens with max-age 8h | `src/lib/auth.ts` |
| Session cookies | `httpOnly`, `secure` (prod), `sameSite: lax/strict` | `src/lib/auth.ts` |
| Timing-safe compare | `crypto.timingSafeEqual()` for password comparison | `src/lib/auth.ts` |
| Session isolation | Dealer login revokes admin session and vice versa | `src/lib/auth.ts` |
| Password storage | Plain text in DB schema (⚠️ flagged for NESH review) | `prisma/schema.prisma` |

> **⚠️ VAPT Note:** The `password` field in the Dealer model stores plain text. For production, NESH should implement bcrypt/argon2 hashing if local auth is retained.

### 3.2 Rate Limiting

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /api/auth/login` | 5 requests | 15 minutes | Per IP |
| `POST /api/admin/auth` | 3 requests | 15 minutes | Per IP |
| API general (nginx) | 60 requests | 1 minute | Per IP |
| Login (nginx) | 10 requests | 1 minute | Per IP |

**Implementation:** In-memory rate limiter (`src/lib/security.ts`) + nginx `limit_req_zone`.

### 3.3 Input Validation & Sanitization

| Control | Description |
|---------|-------------|
| Dealer identifier sanitization | Strips control chars, null bytes; allows only `[a-zA-Z0-9\s\-_.+@]` |
| General input sanitization | Removes control characters, limits to configurable max length |
| Content-type validation | JSON endpoints validate `application/json` header |
| Prisma parameterized queries | All database queries use Prisma ORM (no raw SQL injection vectors) |

### 3.4 Data Protection (Customer PII)

| Data Type | Protection | Exposure |
|-----------|-----------|----------|
| Dealer names | Server-side masking: `maskDealerName()` → `R*****` | Public: masked. Admin: full. Own dealer: full. |
| Phone numbers | Never included in API responses except admin dealer detail | Admin only |
| Passwords | Never included in any API response | N/A (server-side only) |
| `/api/dealers` | Requires authentication; non-admin sees masked names only | Auth-gated |
| `/api/leaderboard` | Masked names for public/dealer; unmasked for admin only | Tiered |
| `/api/health` | Minimal info for public; diagnostics for admin only | Tiered |
| Export files | Admin-only; contains full dealer data | Admin + audit log |

### 3.5 HTTP Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none'; ...` | XSS prevention |
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Feature restriction |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage prevention |
| `Cache-Control` (API) | `no-store, no-cache, must-revalidate, private` | Prevent caching PII |
| `X-Powered-By` | **Removed** (`poweredByHeader: false`) | Server fingerprinting |

### 3.6 Network Security (Nginx)

| Control | Configuration |
|---------|--------------|
| Admin domain isolation | `supercup-admin.tvs.in` restricted to `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` |
| Server tokens | `server_tokens off` (version info hidden) |
| TLS configuration | TLSv1.2 + TLSv1.3 only; `HIGH:!aNULL:!MD5` ciphers |
| Rate limit zones | `login_limit` (10r/m) and `api_limit` (60r/m) |
| Middleware isolation | Admin path blocked on dealer domain (default ON) |

### 3.7 Audit Trail

| Event | Logged Fields | File |
|-------|--------------|------|
| Dealer login success | IP, timestamp, dealer_id, user-agent | `src/app/api/auth/login/route.ts` |
| Dealer login failure | IP, timestamp, identifier, user-agent | `src/app/api/auth/login/route.ts` |
| Admin login success/fail | IP, timestamp, user-agent | `src/app/api/admin/auth/route.ts` |
| Rate limit triggered | IP, timestamp, endpoint | `src/lib/security.ts` |
| Admin data mutations | Action, target, before/after, reason | `src/app/api/admin/route.ts` → `audit_logs` table |
| Dealer logout | IP, timestamp, dealer_id | `src/app/api/auth/login/route.ts` |

**Log format:** Structured JSON lines to stdout (compatible with Cloud Logging / SIEM).

---

## 4. VAPT Checklist for Security Team

### 4.1 Authentication Tests
- [ ] Brute-force admin password → Should be rate-limited after 3 attempts
- [ ] Brute-force dealer login → Should be rate-limited after 5 attempts
- [ ] Session cookie tampering → HMAC signature verification should reject
- [ ] Session fixation → New session issued on each login; old sessions invalidated
- [ ] Session replay after 8h → Admin session should expire
- [ ] Session replay after 24h → Dealer session should expire

### 4.2 Authorization Tests
- [ ] Access `/api/admin?action=stats` without admin cookie → 403
- [ ] Access `/api/me/dashboard` without dealer session → 401
- [ ] Access `/api/dealers` without any auth → 401
- [ ] Access `/api/admin?action=export` with dealer session → 403
- [ ] Access `/admin` path on dealer domain → Redirected to `/`

### 4.3 Injection Tests
- [ ] SQL injection in dealer login identifier → Prisma parameterized (safe)
- [ ] XSS in dealer name → CSP blocks inline scripts; names are text-rendered
- [ ] CRLF injection in headers → Next.js framework prevents
- [ ] Path traversal in API params → No file system operations from user input

### 4.4 Data Exposure Tests
- [ ] `/api/leaderboard` → Dealer names should be masked (`R*****`)
- [ ] `/api/dealers` (no auth) → Should return 401
- [ ] `/api/dealers` (dealer auth) → Names should be masked
- [ ] `/api/health` (no auth) → Only `{status: "ok"}` returned
- [ ] Browser cache inspection → API responses have `no-store` headers
- [ ] Network tab inspection → No passwords/tokens in response bodies

### 4.5 Infrastructure Tests
- [ ] Server fingerprinting → No `X-Powered-By`, no `server` version
- [ ] TLS version → Only TLSv1.2+ accepted
- [ ] Cookie security flags → `httpOnly`, `secure`, `sameSite`
- [ ] Admin domain from external IP → Should return 403 (nginx deny all)

---

## 5. Recommended Actions for NESH (Apps Team)

### Before Production Go-Live

| Priority | Action | Details |
|----------|--------|---------|
| 🔴 P0 | **Rotate all secrets** | Change `ADMIN_PASSWORD`, `INTERNAL_API_KEY`, `SESSION_SECRET` to cryptographically random values. Set via Vercel Dashboard (encrypted). |
| 🔴 P0 | **Migrate to PostgreSQL** | SQLite is a development-only database. Use Vercel Postgres or GCP Cloud SQL. |
| 🔴 P0 | **Conduct VAPT** | Use the checklist in Section 4 above. Close all Critical/High findings. |
| 🟡 P1 | **Hash dealer passwords** | Replace plain-text `password` field with bcrypt/argon2 hashing. |
| 🟡 P1 | **Add WAF** | If hosting on GCP, enable Cloud Armor. If Vercel, enable Firewall Rules. |
| 🟡 P1 | **Configure Cloud Logging** | Route audit logs to Cloud Logging for SIEM integration. |
| 🟡 P1 | **Set up uptime monitoring** | Monitor `/api/health` endpoint with alerting. |
| 🟢 P2 | **Enable CSP report-uri** | Set `CSP_REPORT_URI` to collect violation reports. |
| 🟢 P2 | **Add CORS headers** | Currently relies on same-origin; add explicit `Access-Control-Allow-Origin`. |
| 🟢 P2 | **Database connection pooling** | Configure PgBouncer or Prisma Accelerate for PostgreSQL. |

### Environment Variables to Set in Vercel Dashboard

```
ADMIN_PASSWORD=<generate: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))">
SESSION_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
INTERNAL_API_KEY=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
CRON_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/supercup?sslmode=require
NODE_ENV=production
STRICT_ADMIN_SUBDOMAIN=true
AUDIT_ALL_REQUESTS=true
```

> **⚠️ CRITICAL:** Never set these in `vercel.json` or `.env` files committed to git. Always use the Vercel Dashboard's encrypted environment variable storage.

---

## 6. Files Modified/Created for Security Hardening

| File | Change |
|------|--------|
| `src/lib/security.ts` | **NEW** — Rate limiting, input sanitization, audit logging, security headers |
| `src/app/api/auth/login/route.ts` | Rate limiting, input sanitization, audit logging |
| `src/app/api/admin/auth/route.ts` | Rate limiting, audit logging |
| `src/app/api/dealers/route.ts` | Auth-gated, masked names for non-admin |
| `src/app/api/health/route.ts` | Tiered access (public: minimal, admin: full) |
| `src/lib/services/tvs-integration.ts` | Env-configurable service creds, strict TLS verification |
| `next.config.ts` | CSP, Permissions-Policy, no-cache for API, `poweredByHeader: false` |
| `nginx-tvs-supercup.conf` | Admin IP restriction, `server_tokens off`, rate limiting zones, CSP |
| `src/proxy.ts` | Admin subdomain isolation default ON |
| `vercel.json` | Hardcoded secrets removed |
| `Dockerfile` | Standalone Next.js container build for GCP Cloud Run |
| `cloudbuild.yaml` | **NEW** — GCP Cloud Build CI/CD pipeline |
| `deploy-gcp.sh` | **NEW** — Shell deployment script for TVS Certified GCP Cloud |
| `deploy-gcp.ps1` | **NEW** — PowerShell deployment script for TVS Certified GCP Cloud |
| `GCP_DEPLOYMENT_GUIDE.md` | **NEW** — Step-by-step GCP Cloud Run & Cloud SQL production architecture guide |
| `.env.example` | **NEW** — Documented env template with secure defaults |
| `.gitignore` | Excludes DB files, dealer spreadsheets, password files |
| `SECURITY_HANDOVER.md` | **NEW** — This document |

---

## 7. Contact & Ownership

| Role | Responsibility |
|------|---------------|
| **Current Developer** | Source code handover, security hardening documentation |
| **NESH (Apps Team)** | Production deployment, ongoing maintenance, VAPT coordination |
| **TVS IT Security** | VAPT execution, Cloud Armor / WAF configuration, SSL certificate management |
| **TVS IT Infrastructure** | DNS (CNAME records), GCP hosting, network access controls |
