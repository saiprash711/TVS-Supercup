# TVS Super Cup 2026-27 — TVS Certified GCP Cloud Architecture & Deployment Guide

> **Audience:** TVS Apps Team (NESH), TVS IT Security & TVS Cloud Infrastructure Teams  
> **Classification:** INTERNAL TVS TECHNICAL SPECIFICATION  
> **Target Environment:** TVS Certified Google Cloud Platform (asia-south1 / Mumbai)  
> **Compliance:** TVS InfoSec Standards & VAPT Pre-Approval Requirements  

---

## 1. Executive Summary & Recommended Actions Alignment

This document satisfies **Recommended Action 4 ("Host the website under TVS certified GCP cloud")** and addresses all 5 security review findings:

| Review Finding | GCP Security Control | Architecture Component |
|---|---|---|
| **1. Customer data exposure** | Strict response sanitization, Cloud CDN no-cache on API routes, SSL/TLS termination | Cloud Load Balancing + Next.js App |
| **2. Direct production DB access** | Cloud SQL configured with **Private IP only**; no public IP; accessed strictly via Serverless VPC Access connector | Cloud SQL PostgreSQL + VPC Connector |
| **3. Application integration review** | Complete source code, Docker image build, and GCP pipeline prepared for NESH review | Cloud Build + Artifact Registry |
| **4. VAPT & security review** | Cloud Armor WAF with OWASP CRS; pre-configured VAPT test harness and scan authorization | Google Cloud Armor |
| **5. Unauthorized access & data leakage** | Cloud Armor IP filtering (admin portal locked to TVS VPN/Office IP range); Secret Manager for credentials | Secret Manager + Cloud Armor |

---

## 2. Target GCP Production Architecture

```
                                  INTERNET / DEALERS
                                          │
                                          ▼ [HTTPS / TLS 1.3]
                        ┌───────────────────────────────────┐
                        │    Google Cloud Load Balancer      │
                        │    ├── supercup.tvs.in            │
                        │    └── supercup-admin.tvs.in      │
                        └─────────────────┬─────────────────┘
                                          │
                                          ▼
                        ┌───────────────────────────────────┐
                        │      Google Cloud Armor (WAF)      │
                        │  ├── Rule 1: Allow TVS VPN on /admin│
                        │  ├── Rule 2: Rate limit (100 r/m) │
                        │  ├── Rule 3: OWASP Top 10 CRS      │
                        │  └── Rule 4: Geo-restriction (IN) │
                        └─────────────────┬─────────────────┘
                                          │
                                          ▼
                        ┌───────────────────────────────────┐
                        │    Google Cloud Run (Serverless)  │
                        │    └── Service: tvs-supercup       │
                        │    ├── Standalone Next.js 16      │
                        │    ├── In-memory rate limiting    │
                        │    ├── PII Masking Engine         │
                        │    └── Structured JSON Logging    │
                        └─────────┬───────────────────┬─────┘
                                  │                   │
                     Secret Mount │                   │ Serverless VPC Access
                                  ▼                   ▼
                     ┌──────────────────┐    ┌──────────────────────────────────┐
                     │  Secret Manager   │    │  TVS VPC (Private Subnet)         │
                     │  ├── DB_URL      │    │  └── Cloud SQL (PostgreSQL 16)   │
                     │  ├── ADMIN_PASS  │    │      ├── Private IP ONLY         │
                     │  ├── INTERNAL_KEY│    │      ├── Automated Daily Backups │
                     │  └── SESS_SECRET │    │      └── Zero External Exposure  │
                     └──────────────────┘    └──────────────────────────────────┘
```

---

## 3. Step-by-Step GCP Infrastructure Provisioning

### Step 3.1: Enable Required GCP APIs
Run via Cloud Shell or authorized admin workstation:
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  compute.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 3.2: Create Artifact Registry Repository
```bash
gcloud artifacts repositories create tvs-apps \
  --repository-format=docker \
  --location=asia-south1 \
  --description="TVS Applications Container Registry"
```

### Step 3.3: Provision Cloud SQL (PostgreSQL) — Zero Public Access
```bash
# 1. Create Cloud SQL PostgreSQL instance with Private IP only
gcloud sql instances create tvs-supercup-db \
  --database-version=POSTGRES_16 \
  --cpu=2 \
  --memory=4GiB \
  --region=asia-south1 \
  --network=projects/$PROJECT_ID/global/networks/default \
  --no-assign-ip \
  --storage-auto-increase \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03

# 2. Create the production database and user
gcloud sql databases create supercup --instance=tvs-supercup-db
gcloud sql users create supercup_app --instance=tvs-supercup-db --password="<GENERATE_SECURE_PASSWORD>"
```

### Step 3.4: Configure Serverless VPC Access Connector
Allows Cloud Run to reach Cloud SQL over private IP:
```bash
gcloud compute networks vpc-access connectors create tvs-vpc-connector \
  --region=asia-south1 \
  --range=10.8.0.0/28 \
  --network=default
```

### Step 3.5: Store Production Secrets in Secret Manager
```bash
# Store database connection string (points to Cloud SQL private IP)
echo -n "postgresql://supercup_app:<PASSWORD>@<PRIVATE_IP>:5432/supercup?sslmode=prefer" | \
  gcloud secrets create supercup-database-url --data-file=-

# Store cryptographically random administrator password
node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))" | \
  gcloud secrets create supercup-admin-password --data-file=-

# Store internal API key for webhooks/sync
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" | \
  gcloud secrets create supercup-internal-key --data-file=-

# Store session signing secret
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" | \
  gcloud secrets create supercup-session-secret --data-file=-
```

---

## 4. Cloud Armor Security Policy Configuration (WAF)

Google Cloud Armor provides enterprise DDoS mitigation and Web Application Firewall capabilities.

```bash
# 1. Create Cloud Armor security policy
gcloud compute security-policies create tvs-supercup-armor \
  --description="TVS Super Cup Enterprise WAF Policy"

# 2. Block known SQLi and XSS patterns using OWASP Core Rule Set
gcloud compute security-policies rules create 1000 \
  --security-policy=tvs-supercup-armor \
  --expression="evaluatePreconfiguredExpr('sqli-v33-stable')" \
  --action=deny-403 \
  --description="Block SQL Injection"

gcloud compute security-policies rules create 1001 \
  --security-policy=tvs-supercup-armor \
  --expression="evaluatePreconfiguredExpr('xss-v33-stable')" \
  --action=deny-403 \
  --description="Block Cross-Site Scripting"

# 3. Restrict Admin Console (/admin*) strictly to TVS Corporate Network & VPN
gcloud compute security-policies rules create 2000 \
  --security-policy=tvs-supercup-armor \
  --expression="request.path.startsWith('/admin') && !inIpRange(origin.ip, '10.0.0.0/8') && !inIpRange(origin.ip, '172.16.0.0/12')" \
  --action=deny-403 \
  --description="Restrict admin console to TVS corporate IPs"

# 4. Rate limit aggressive traffic (anti-brute-force)
gcloud compute security-policies rules create 3000 \
  --security-policy=tvs-supercup-armor \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=120 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=300 \
  --conform-action=allow \
  --description="Rate limit clients exceeding 120 req/min"
```

---

## 5. Deployment Options on TVS GCP

### Option A: Automated Cloud Build Pipeline (Recommended)
Trigger build and deployment automatically via `cloudbuild.yaml`:
```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Option B: Direct Script Deployment
Using the included deployment scripts:
- **Linux/macOS:** `./deploy-gcp.sh`
- **Windows PowerShell:** `.\deploy-gcp.ps1`

---

## 6. Database Migration & Seed on Cloud SQL

Once the Cloud Run container has access to Cloud SQL:
```bash
# Run database schema migration
npx prisma db push --schema=prisma/schema.production.prisma

# Seed dealers, campaigns, match days, and rules
npx ts-node -r tsconfig-paths/register --project tsconfig.seed.json prisma/seed.ts
```

---

## 7. DNS & SSL Certificate Setup

TVS Domain Administrators point records to the Google Cloud Load Balancer IP:

| Record Type | Host | Target / Value | Purpose |
|---|---|---|---|
| **A** | `supercup.tvs.in` | `<GCP_LOAD_BALANCER_IP>` | Dealer Portal |
| **A** | `supercup-admin.tvs.in` | `<GCP_LOAD_BALANCER_IP>` | TVS Internal Admin Portal |

Google Cloud Load Balancing automatically issues and provisions managed SSL/TLS certificates via Let's Encrypt / Google Trust Services upon DNS resolution.

---

## 8. Handover Verification Checklist for NESH

Before production sign-off:
- [ ] Container image built from repository root with `standalone` output
- [ ] Cloud SQL instance has `--no-assign-ip` (Private IP only)
- [ ] Cloud Armor WAF enabled with OWASP CRS + TVS VPN IP restriction
- [ ] No hardcoded passwords in `.env`, `vercel.json`, or code
- [ ] `/api/dealers` returns 401 when unauthenticated
- [ ] `/api/health` returns only `{ status: "ok" }` to public traffic
- [ ] Public leaderboard dealer names are masked (`R*****`)
- [ ] Audit logs flow to Google Cloud Logging (`component: supercup-audit`)
