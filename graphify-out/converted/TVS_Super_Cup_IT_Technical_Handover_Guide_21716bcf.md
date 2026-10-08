<!-- converted from TVS_Super_Cup_IT_Technical_Handover_Guide.docx -->

TVS CERTIFIED SUPER CUP 2026–27
IT Architecture & Technical Handover Guide
Application architecture • TVS integration • data flow • security • deployment • operations


# 1. Executive Summary
The TVS Certified Super Cup platform is a web application built on Next.js that sits on top of the existing TVS Certified ecosystem. It provides a dealer-facing portal, public leaderboard, and administrator console. Its core purpose is to consume relevant dealer auction activity, associate that activity with a campaign and match/auction, apply configurable point rules, maintain dealer scores and rankings, and expose the resulting information through secure web interfaces.
The application is not intended to replace the TVS Certified auction platform. TVS Certified remains the source system for dealer identity and auction activity; the Super Cup application acts as the campaign orchestration, scoring, ranking, visualization, and administration layer.
Recommended one-sentence description:

# 2. Explanation
This is a Next.js-based web application hosted in the documented production architecture on Vercel. The frontend provides the dealer portal, leaderboard and admin console. The backend is implemented using Next.js API routes and Prisma ORM. The application connects to TVS Certified services through a dedicated integration layer, retrieves relevant dealer/auction activity, stores campaign data, applies configurable point rules, calculates rankings, and returns the results to the appropriate portal.
# 3. High-Level Architecture

## 3.1 Architectural principle
The system separates presentation, API/request handling, business services, persistence, and external integration. This allows the scoring/ranking logic to evolve without requiring the frontend to contain the business rules.
# 4. Technology Stack

# 5. Repository / Code Structure
src/
├── app/
│   ├── admin/
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dealers/
│   │   ├── health/
│   │   ├── internal/events/
│   │   ├── leaderboard/
│   │   └── me/
│   │       ├── activities/
│   │       └── dashboard/
│   ├── components/
│   ├── dashboard/
│   ├── leaderboard/
│   └── page.tsx
│
├── lib/
│   ├── data/
│   │   ├── tvs-customer-mapping.json
│   │   └── tvs-user-mapping.json
│   ├── services/
│   │   ├── campaign.ts
│   │   ├── masking.ts
│   │   ├── points-engine.ts
│   │   ├── ranking-engine.ts
│   │   ├── tvs-integration.ts
│   │   └── tvs-sync.ts
│   ├── auth.ts
│   └── db.ts
│
└── proxy.ts

prisma/
└── schema.prisma

scripts/
├── live-sync-daemon.ts
├── verify_live_readiness.ts
├── setup_prelaunch_test_campaign.ts
└── other operational / inspection scripts

Deployment:
Dockerfile
docker-compose.yml
vercel.json
deployment scripts
PM2 ecosystem configuration
# 6. Frontend Architecture
The frontend has three primary user-facing surfaces:
- Dealer Login and Dealer Dashboard
- Public Leaderboard
- Administrator Console
The dashboard is dynamically backed by the application APIs and database rather than being a static display. The dashboard API identifies the current dealer, selects the applicable campaign, synchronizes dealer activities, retrieves ranking context, calculates the activity breakdown, and constructs match participation information.
Dealer Dashboard request flow

Browser
  ↓
GET /api/me/dashboard
  ↓
Authenticate dealer
  ↓
Select active campaign
  ↓
Synchronize TVS activities
  ↓
Get ranking position
  ↓
Get activity breakdown
  ↓
Get match-day participation
  ↓
Return JSON
  ↓
React renders dashboard
# 7. Backend Architecture
There is no separate Express/Django backend in the repository. The backend is colocated with Next.js using server-side API route handlers. The API layer is intentionally thin: it validates requests/authentication and delegates business logic to service modules under src/lib/services.
Browser / Admin UI
       ↓
Next.js API Route
       ↓
Authentication / Authorization
       ↓
Service Layer
       ├── campaign.ts
       ├── tvs-integration.ts
       ├── tvs-sync.ts
       ├── points-engine.ts
       ├── ranking-engine.ts
       └── masking.ts
       ↓
Prisma
       ↓
Database
# 8. TVS Certified Integration Layer
The dedicated integration module is src/lib/services/tvs-integration.ts. It defines application-side interfaces for TVS dealer profiles, customer profiles, authentication results, auction activities and discovered auctions. The source comments document TVS Certified authentication, auction/bid, master/inspection and real-time bidding services.
Super Cup Application
        │
        │ HTTPS / API
        ▼
TVS Certified services
        │
        ├── Authentication
        ├── User / Customer data
        ├── Auctions
        ├── Bids
        ├── Transactions
        └── Related activity
The Super Cup application therefore does not recreate the auction engine. It consumes relevant information from the existing TVS Certified ecosystem and transforms that information into campaign activities.
# 9. Dealer Identity & Mapping
The repository contains static mapping data for TVS users and customers and application logic that resolves external TVS identities to internal dealer records. This is necessary because the external platform may expose different identifiers at the user/customer/dealer level.
TVS User ID
    ↓
Customer / external identity
    ↓
Internal Dealer record
    ↓
Campaign activity / score
# 10. Database Architecture
The Prisma schema models the application around dealers, campaigns, match days, activities, scoring rules, scores, tiers and audit records.

Campaign
  │
  ├── MatchDay
  ├── PointRule
  ├── DealerActivity ─── Dealer
  ├── DealerScore    ─── Dealer
  └── DealerTier     ─── Dealer

AuditLog records administrative changes separately.
# 11. Campaign & Match-Day Model
The system is campaign-oriented rather than hard-coded around a single leaderboard. A campaign contains match days, point rules, activities, scores and tiers. The campaign service selects a currently applicable active Super Cup campaign based on the campaign date window.
Campaign
  │
  ├── Match 1 → Auction ID
  ├── Match 2 → Auction ID
  ├── Match 3 → Auction ID
  └── Match 4 → Auction ID
This separation allows different campaign instances to be isolated and prevents activities/scores from unrelated campaigns being mixed.
# 12. Points Engine
The points engine translates activity types into points using active campaign-specific PointRule records. Activity types in the code include selling, buying, participation and bidding activities, with some legacy/deactivated activity types also present.
TVS Activity
     ↓
Activity Type
     ↓
Campaign PointRule
     ↓
Points
     ↓
DealerActivity
Representative activity types include:
- SELL_LISTING
- SELL
- SELL_COMMISSION
- MATCH_PARTICIPATION
- BID_PLACED
- BUY
The exact production point values should be treated as configuration/business rules and validated with the campaign owner before production freeze, because the repository contains both current and legacy/deactivated rule references.
# 13. Duplicate Activity / Double-Scoring Prevention
The system contains explicit deduplication logic so that the same external activity does not award points repeatedly. It checks dealer, campaign, match, activity type and external transaction identifiers before creating an activity. Participation is also constrained to at most one participation record per dealer and match.
Incoming activity
      ↓
Already recorded?
   ┌──┴──┐
  YES    NO
   ↓      ↓
Ignore   Calculate points
           ↓
       Store activity
There is also a database/ORM-level safeguard for unique-constraint races, so concurrent duplicate writes are treated as duplicates rather than awarding points twice.
# 14. Participation Detection
Participation can be established from explicit match participation or verified live-auction activity. The dashboard logic also treats relevant BUY, SELL and live BID activity as evidence of room participation, while distinguishing pre-bids from live bids.
# 15. Ranking Engine
The points engine and ranking engine are separate. The points engine answers 'How many points does this activity earn?' while the ranking engine answers 'Where does the dealer stand compared with other dealers?'
DealerActivity
      ↓
Aggregate points
      ↓
DealerScore
      ↓
Sort / ranking
      ↓
Leaderboard + dealer position context
# 16. Public Leaderboard & Data Masking
The public leaderboard is intentionally different from the administrator view. Public requests return masked dealer names. Authenticated administrators can request unmasked names.
Public:
1. R*****
2. A*****
3. S*****

Authorized Admin:
1. Full dealer name
2. Full dealer name
3. Full dealer name
This is enforced in the leaderboard API through an admin authentication check before unmasking is allowed.
# 17. Authentication & Authorization
## 17.1 Dealer authentication
A successful dealer authentication creates a supercup_session HTTP-only cookie. The documented session lifetime is 24 hours. Dealer login also clears the admin session cookie so a browser session does not simultaneously hold both roles.
## 17.2 Admin authentication
Administrator authentication is implemented through /api/admin/auth and creates a separate admin session. Admin APIs perform an authorization check before executing protected operations.
Dealer
  ↓
TVS / dealer authentication
  ↓
supercup_session
  ↓
Dealer dashboard

Admin
  ↓
Admin credential
  ↓
supercup_admin
  ↓
Admin console
# 18. Request Proxy, Domain Routing & Route Protection
src/proxy.ts acts as a request routing/controller layer. It inspects the host header (including forwarded-host) and identifies whether the request is intended for the dealer or admin subdomain.
supercup.tvs.in
       ↓
Dealer portal

supercup-admin.tvs.in
       ↓
/admin
       ↓
Admin console

Unauthenticated /dashboard
       ↓
Redirect to /

Authenticated dealer /
       ↓
Redirect to /dashboard
The proxy also supports an optional strict-admin-subdomain mode that can prevent /admin from being accessed from the dealer-facing domain.
# 19. Admin Console & Administrative APIs
The admin API supports dashboard statistics, dealer management, ranking recalculation, manual point adjustment, audit retrieval, export and synchronization operations. Admin access is checked before protected operations are executed.
- View campaign and dealer statistics
- View full dealer information
- Recalculate rankings
- Perform manual point adjustments
- Review audit information
- Export data
- Trigger or manage synchronization operations
# 20. Audit Trail
The database includes an AuditLog entity for administrative changes. The model supports action types such as POINTS_ADJUSTED, RULE_CHANGED, SCORE_RECALCULATED and MATCH_UPDATED, together with the admin user, target, details, reason and timestamp.
Admin action
    ↓
AuditLog
    ├── admin user
    ├── action
    ├── target
    ├── details / before-after
    ├── reason
    └── timestamp
# 21. Live Auction Synchronization
The synchronization layer is src/lib/services/tvs-sync.ts, with a live synchronization daemon under scripts/live-sync-daemon.ts. The documented system also contains a serverless/internal-event path for scheduled processing.
Auction activity
      ↓
TVS Certified API
      ↓
Sync process
      ↓
Identify campaign + match
      ↓
Resolve dealer
      ↓
Validate campaign time window
      ↓
Deduplicate
      ↓
Record DealerActivity
      ↓
Calculate points
      ↓
Recalculate rankings
      ↓
Leaderboard / dashboard
The repository documents a configurable polling interval for the live daemon (10 seconds in the documented operating flow) and also documents a Vercel cron/serverless path for periodic processing. These are alternative/overlapping operational mechanisms and should be standardized for production.
# 22. End-to-End Dealer Login Flow
- Dealer opens the Super Cup domain.
- Next.js proxy evaluates the request and route.
- Unauthenticated dealer sees the login page.
- Dealer submits credentials.
- Authentication logic validates the identity and resolves the dealer.
- The application creates the dealer session cookie.
- Dealer is redirected to /dashboard.
- Dashboard calls /api/me/dashboard.
- Backend identifies the current dealer and active campaign.
- TVS activities are synchronized.
- Existing activities are checked for duplicates.
- New activities are recorded and points are calculated.
- Ranking context and activity breakdown are calculated.
- Dashboard JSON is returned and rendered by React.
# 23. End-to-End Auction Flow
- Dealer performs an activity in TVS Certified.
- The TVS Certified system exposes the relevant activity through its integration/API path.
- The Super Cup sync process retrieves the activity.
- The activity is associated with the applicable campaign and match/auction.
- The external dealer identity is mapped to the internal dealer.
- The activity timestamp is checked against the campaign window.
- Duplicate checks are performed.
- The configured PointRule is applied.
- DealerActivity is stored.
- Dealer score/ranking is recalculated.
- Leaderboard and dealer dashboards reflect the updated position.
# 24. Static vs Dynamic Data

# 25. Hosting & Deployment Architecture
The primary documented production architecture is Vercel for the Next.js application with PostgreSQL/Vercel Postgres for production persistence. The repository also contains Docker, VPS and PM2 deployment configurations, indicating alternative deployment models.
Git repository
      ↓
Vercel build
      ↓
Prisma generate
      ↓
Next.js build
      ↓
Production deployment
      ↓
PostgreSQL

Optional separate worker:
VPS / Railway / similar
      ↓
live-sync-daemon
      ↓
TVS APIs
# 26. Recommended TVS DNS / Domain Setup
TVS DNS / WAF
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
     supercup.tvs.in       supercup-admin.tvs.in
             │                       │
             └───────────┬───────────┘
                         ▼
                       Vercel
                         │
                  ┌──────┴──────┐
                  ▼             ▼
             Dealer Portal   Admin Console
The existing handover documentation recommends the subdomain model with separate dealer and admin domains. If TVS IT prefers a single domain, the documented alternative is to expose the dealer portal at the root and the admin console under /admin.
# 27. What IT Needs to Configure
- DNS records for the approved production domain/subdomains.
- Vercel/domain ownership and project access or the organization's equivalent hosting arrangement.
- Production PostgreSQL/Vercel Postgres configuration.
- Approved environment variables and secret-management mechanism.
- Network/WAF/firewall review for outbound connectivity to required TVS Certified services.
- Production TVS API credentials/permissions.
- Monitoring and logging ownership.
- Database backup/retention policy.
- Production SSL/TLS validation (Vercel-managed if Vercel remains the host).
- Operational support/escalation ownership.
- Final production testing and sign-off.

# 28. Security Architecture
- Dealer session authentication using an HTTP-only session cookie.
- Separate administrator authentication/session.
- Protected admin APIs.
- Protected internal event/synchronization endpoint using an internal API key.
- Cron authorization using a secret where applicable.
- Public leaderboard name masking.
- Environment-based secret configuration for production.
- Audit logging for administrative adjustments.
# 29. Production Security / Handover Actions

The production model should use environment variables or an enterprise secret manager for database credentials, admin credentials, internal API keys, cron secrets and TVS integration credentials/tokens.
# 30. Production Architecture Items to Standardize
The repository contains multiple deployment and synchronization variants. These should be treated as implementation options rather than assumed to be simultaneously required in production.

# 31. IT Handover Checklist
- ☐ Confirm production domain and subdomain names.
- ☐ Confirm Vercel project ownership or alternate hosting target.
- ☐ Confirm production PostgreSQL instance and DATABASE_URL.
- ☐ Confirm database migration/seed procedure.
- ☐ Confirm TVS API endpoints and production access.
- ☐ Confirm dealer/user/customer identity mapping strategy.
- ☐ Rotate/revoke development credentials and tokens.
- ☐ Move all production secrets to approved secret management.
- ☐ Confirm ADMIN_PASSWORD / administrator access process.
- ☐ Confirm INTERNAL_API_KEY and CRON_SECRET handling.
- ☐ Select one production synchronization operating model.
- ☐ Configure DNS and WAF/firewall rules.
- ☐ Configure monitoring, logging and alerts.
- ☐ Define database backup and recovery process.
- ☐ Validate public masking and admin unmasking.
- ☐ Validate duplicate activity protection.
- ☐ Validate point rules and campaign dates.
- ☐ Run end-to-end production/UAT test.
- ☐ Define support/escalation ownership.
- ☐ Obtain final IT/security sign-off.
# Appendix A — Key Files and Responsibilities

# Appendix B — Core Data Flow Summary
1. Dealer identity originates in TVS Certified.
2. Super Cup resolves/maps the external identity to an internal Dealer.
3. Campaign determines the applicable date/match/rule context.
4. TVS activity is normalized into a Super Cup activity type.
5. Duplicate checks prevent repeat scoring.
6. PointRule determines the activity's points.
7. DealerActivity persists the event and points.
8. DealerScore/ranking logic aggregates the dealer's position.
9. Public UI masks dealer identity.
10. Admin UI can access authorized unmasked data and operational controls.
# Appendix C — Important Terminology


| Document purpose
This document consolidates the technical explanation of the TVS Certified Super Cup web application into an IT-handover format. It is based on the supplied repomix export and its embedded project documentation. Where the repository contains development and production variants, those differences are explicitly called out rather than silently reconciled. |
| --- |
| System description
“We built a campaign orchestration platform on top of the existing TVS Certified ecosystem that consumes dealer auction activity, converts those activities into configurable campaign points, maintains dealer-level scores and rankings, and exposes the results through secure dealer and administrator portals.” |
| --- |
| Layer | Technology / Component | Role |
| --- | --- | --- |
| Frontend | Next.js 16 / React 19 | Dealer portal, leaderboard, admin UI |
| Language | TypeScript | Application and service code |
| Backend | Next.js API Routes | HTTP APIs and server-side operations |
| ORM | Prisma 6 | Database access and schema management |
| Production DB | PostgreSQL / Vercel Postgres (documented target) | Persistent production data |
| Local development DB | SQLite | Convenient local development/test database |
| Hosting | Vercel (documented primary architecture) | Web application hosting, SSL/TLS, serverless runtime |
| Background processing | Node.js sync daemon / cron path | Auction activity synchronization |
| Styling | CSS Modules / global CSS | UI styling |
| Animation/UI | Motion, Lucide React, React Icons | Interaction and visual components |
| Data export | xlsx | Administrative spreadsheet export |
| Entity | Purpose |
| --- | --- |
| Dealer | Internal representation of a participating dealer and external dealer identity |
| Campaign | Defines a Super Cup/loyalty/recognition campaign and its active date window |
| MatchDay | Represents an auction/match within a campaign and can store an external auction ID |
| DealerActivity | Stores individual dealer activities, timestamps, transaction identifiers, metadata and points |
| PointRule | Stores campaign-specific activity-to-points configuration |
| DealerScore | Stores dealer-level campaign scoring/ranking information |
| DealerTier | Stores campaign-specific tier progression |
| AuditLog | Records administrative actions and before/after details |
| Category | Examples | Source |
| --- | --- | --- |
| Application/UI assets | CSS, images, components, animations | Application repository |
| Campaign configuration | Campaign dates, match days, point rules | Application database/configuration |
| Dealer data | Dealer identity, city, status | Database + TVS identity mapping |
| Live activity | Bids, buys, sells, participation | TVS Certified integration |
| Scores/rankings | Points, rank, position context | Application database / ranking engine |
| Important
Under the documented Vercel architecture, TVS IT does not need to operate a traditional Linux web server, Nginx instance, or manually renew the Vercel-managed SSL certificate. A separate worker/server may still be required if continuous background synchronization is selected. |
| --- |
| Action required before production handover
The repository export contains development/integration scripts that include credentials or authentication material. These values should not be presented in the IT handover, committed as production secrets, or reused without review. Before production, credentials/tokens should be rotated/revoked as appropriate and moved to the organization's approved secret-management mechanism. |
| --- |
| Area | Observed in repository | IT decision / action |
| --- | --- | --- |
| Database | SQLite schema for local development; PostgreSQL documented for production | Standardize production on PostgreSQL and validate migrations/connection settings |
| Synchronization | Live Node daemon plus serverless/internal-event path | Select the supported production operating model and avoid duplicate processing paths |
| Hosting | Vercel plus Docker/VPS/PM2 alternatives | Confirm the final hosting responsibility and support model |
| Secrets | Environment-variable model documented; some scripts contain credentials | Rotate/remove embedded secrets and use approved secret management |
| Point rules | Current and legacy/deactivated rule references exist | Freeze and sign off the production rule configuration |
| Domain | Separate dealer/admin subdomains proposed | Confirm DNS/WAF architecture with TVS IT |
| File / Area | Responsibility |
| --- | --- |
| src/proxy.ts | Domain routing, session-aware redirects, route protection |
| src/lib/auth.ts | Dealer/admin authentication and session handling |
| src/lib/db.ts | Prisma database client access |
| src/lib/services/tvs-integration.ts | TVS Certified integration interfaces/provider logic |
| src/lib/services/tvs-sync.ts | Synchronizes external activities into campaign activities |
| src/lib/services/points-engine.ts | Point rules, activity recording, deduplication and activity breakdown |
| src/lib/services/ranking-engine.ts | Dealer rankings and position context |
| src/lib/services/campaign.ts | Current campaign selection and campaign/match retrieval |
| src/lib/services/masking.ts | Dealer identity masking |
| src/app/api/leaderboard/route.ts | Public/admin leaderboard API |
| src/app/api/me/dashboard/route.ts | Dealer dashboard data API |
| src/app/api/admin/route.ts | Admin statistics, management, recalculation, export and related actions |
| src/app/api/admin/auth/route.ts | Admin authentication endpoint |
| src/app/api/internal/events/route.ts | Internal event/synchronization entry point |
| prisma/schema.prisma | Database schema |
| scripts/live-sync-daemon.ts | Continuous live synchronization process |
| vercel.json | Vercel deployment/cron configuration |
| ecosystem.config.js | PM2/VPS process configuration |
| IT_HANDOVER_GUIDE.md | Existing domain/routing handover documentation |
| Term | Meaning in this application |
| --- | --- |
| Dealer | Participating dealer represented internally by a database record. |
| Campaign | A bounded scoring/engagement program such as Super Cup. |
| MatchDay | A campaign auction/match mapped to an external auction ID. |
| DealerActivity | A normalized event representing a dealer action. |
| PointRule | Configuration that maps an activity type to points. |
| DealerScore | Campaign-level accumulated scoring/ranking information. |
| TVS Provider | Application abstraction used to communicate with TVS Certified services. |
| Sync | Process that fetches external activity and writes it into the Super Cup data model. |
| Masking | Public presentation of dealer identity without exposing full enterprise names. |
| AuditLog | Record of administrative changes for traceability. |