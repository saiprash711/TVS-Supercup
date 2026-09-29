# TVS Dealer Super Cup 2026–27: Vercel Domain & Routing Handover Guide

This guide details how to link your **Vercel-deployed Super Cup application** to the official **`tvs.in`** domain, how routing and redirection between **Dealer View** and **Admin View** work, and what the **TVS IT / DNS team** needs to configure.

---

## 1. Hosting Architecture Overview

* **Hosting Platform:** Vercel (Edge & Serverless Node.js Runtime)
* **Application Framework:** Next.js 16 with Turbopack & Edge Request Proxy
* **SSL/TLS:** Automated SSL termination managed by Vercel
* **Database:** Production PostgreSQL / Vercel Postgres

Because the application is hosted on Vercel, **the TVS IT team does NOT need to configure Linux servers, Nginx, or manage SSL certificate renewals.** They only need to add standard **DNS CNAME records**.

---

## 2. Recommended Routing Setup (2 Options)

### Option A: Subdomain Model (⭐️ Recommended)
Separate dealer traffic from internal TVS admin traffic:

| Portal | Target Public Domain | Vercel Handling | Description |
| :--- | :--- | :--- | :--- |
| **Dealer Portal** | `https://supercup.tvs.in` | Points to project root (`/`) | Dealers enter their TVS credentials $\rightarrow$ Auto-redirected to `/dashboard` |
| **Admin Console** | `https://supercup-admin.tvs.in` | Edge Proxy auto-routes to `/admin` | TVS internal managers enter admin passkey for auction management |

* **How the app handles this automatically:**  
  Our [`src/proxy.ts`](file:///c:/supercup_Watermelon/TVS-Supercup/src/proxy.ts) detects the `supercup-admin.tvs.in` domain and automatically routes visitors to `/admin`, while keeping `supercup.tvs.in` on the dealer login and dashboard.

---

### Option B: Single Subdomain Model (Simplest — Only 1 DNS Record)
If TVS IT only wants to add one domain:

| Portal | Target URL | Description |
| :--- | :--- | :--- |
| **Dealer Portal** | `https://supercup.tvs.in` | Login $\rightarrow$ `/dashboard` |
| **Admin Console** | `https://supercup.tvs.in/admin` | Direct access to Admin Command Center |

---

## 3. How Redirection Works

1. **Dealers:**
   * Dealer opens `https://supercup.tvs.in`.
   * If logged in with active cookie `supercup_session` $\rightarrow$ Next.js Proxy immediately forwards them to `/dashboard`.
   * If not logged in $\rightarrow$ Renders the Dealer Login Page (`/`).
   * If an unauthenticated user tries to visit `/dashboard` directly $\rightarrow$ Proxy redirects them to `/`.

2. **Admins:**
   * Management opens `https://supercup-admin.tvs.in` (Option A) or `https://supercup.tvs.in/admin` (Option B).
   * Renders the executive Admin Console with Thursday auction controls, score simulators, and telemetry.

---

## 4. What TVS IT Team Needs to Do (DNS Setup)

Request the TVS IT / Domain Administrator to add the following **CNAME record(s)** in the `tvs.in` DNS management console (e.g., AWS Route53, Cloudflare, or GoDaddy):

### Option A (Two Subdomains):
```text
Record 1 (Dealer View):
  Type:  CNAME
  Name:  supercup
  Value: cname.vercel-dns.com
  TTL:   Automatic / 300s

Record 2 (Admin View):
  Type:  CNAME
  Name:  supercup-admin
  Value: cname.vercel-dns.com
  TTL:   Automatic / 300s
```

### Option B (Single Subdomain):
```text
Record (Single Unified):
  Type:  CNAME
  Name:  supercup
  Value: cname.vercel-dns.com
  TTL:   Automatic / 300s
```

> **Note on Cloudflare / WAF:** If TVS IT uses Cloudflare, they can set the CNAME proxy status to **DNS Only (Grey Cloud)** or **Proxied (Orange Cloud)**. Vercel supports both.

---

## 5. What You Need to Do in Vercel Dashboard

Once IT adds the DNS records (or right before):

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**.
2. Select your **`supercup`** project.
3. Click **Settings** (top navigation) $\rightarrow$ **Domains** (left sidebar).
4. In the "Add Domain" input box:
   * Type: `supercup.tvs.in` $\rightarrow$ Click **Add**.
   * (If using Option A) Type: `supercup-admin.tvs.in` $\rightarrow$ Click **Add**.
5. Vercel will verify the DNS records and show a green **Valid Configuration** checkmark.
6. Vercel automatically generates and provisions the HTTPS / SSL certificate within 1–2 minutes.

---

## 6. Ready-to-Send Email Draft for TVS IT

```text
Subject: Request for DNS CNAME Configuration: TVS Dealer Super Cup (Vercel)

Dear IT / Domain Administration Team,

We have deployed the TVS Dealer Super Cup 2026–27 web application on Vercel. 

To link our production application to the official tvs.in domain, we require a DNS CNAME record to be added under tvs.in.

Application Details:
- Hosting Platform: Vercel (Edge & Cloud Infrastructure)
- Target CNAME: cname.vercel-dns.com

Requested DNS Entries:

Option A (Recommended - Separate Dealer and Admin Portals):
1. Dealer Portal:
   - Type: CNAME
   - Host / Name: supercup (for supercup.tvs.in)
   - Points To / Value: cname.vercel-dns.com

2. Admin Console:
   - Type: CNAME
   - Host / Name: supercup-admin (for supercup-admin.tvs.in)
   - Points To / Value: cname.vercel-dns.com

(Alternatively, if you prefer a single domain, only Record #1 "supercup.tvs.in" is required, and our internal application router will handle the /admin subpath.)

SSL / TLS Certificates are automatically provisioned and renewed by Vercel upon DNS propagation.

Please let us know once the records have been created or if any ownership verification TXT token is required.

Thank you,
[Your Name]
TVS Super Cup Project Team
```
