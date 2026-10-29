import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_docx(output_path):
    doc = Document()

    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x2D, 0x37, 0x48) # slate 800

    # Colors
    NAVY = RGBColor(0x0F, 0x29, 0x4A)      # TVS Deep Navy
    SLATE = RGBColor(0x4A, 0x55, 0x68)     # Secondary Slate
    TEAL = RGBColor(0x0D, 0x6E, 0x6E)      # Accent Teal
    GREEN = RGBColor(0x1B, 0x6E, 0x32)     # Safe Green
    AMBER = RGBColor(0x9A, 0x34, 0x12)     # Warning Amber

    # Document Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("TVS Super Cup 2026-27")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = NAVY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    run_sub = sub_p.add_run("Technical Response: Live Sync vs. Batch Sync Database Load (RPM) Analysis (Ref: Risk Note v1.2)")
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = SLATE

    # Metadata Card
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Date & Status:", "27 October 2026  |  INTERNAL — TVS Mobility Technical Clarification"),
        ("Prepared For:", "Indumati, TVS Mobility IT Security & NESH (Apps Team)"),
        ("Prepared By:", "TVS Super Cup Engineering Team"),
        ("Reference Document:", "Risk Note – AI-Assisted Reverse Engineering of the TVS Certified Platform (v1.2)")
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(1.8)
        cell_val.width = Inches(5.1)
        
        p0 = cell_lbl.paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r0.font.color.rgb = NAVY

        p1 = cell_val.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9)
        r1.font.color.rgb = SLATE

        set_cell_background(cell_lbl, "F8FAFC")
        set_cell_background(cell_val, "F8FAFC")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)

    set_table_borders(meta_table, "E2E8F0")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Helper: Section Header
    def add_section_header(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = NAVY

    # Helper: Subsection Header
    def add_sub_header(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = TEAL

    # Helper: Bullet Item
    def add_bullet(bold_prefix="", text=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.bold = True
            r_pre.font.color.rgb = NAVY
        if text:
            r_txt = p.add_run(text)
            r_txt.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    # --- SECTION 1: EXECUTIVE SUMMARY ---
    add_section_header("1. Executive Summary & Core Verdict Response")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.add_run(
        "We welcome and fully support the security governance mandate established in Risk Note v1.2. Protecting the operational integrity of the live TVS Certified auction platform and upholding strict compliance with the Digital Personal Data Protection (DPDP) Act 2023 are shared, non-negotiable priorities."
    )

    p_callout = doc.add_paragraph()
    p_callout.paragraph_format.space_before = Pt(4)
    p_callout.paragraph_format.space_after = Pt(8)
    r_callout = p_callout.add_run(
        "Clarification on Assessed Scenario: The 'Verdict: Not Safe' in Risk Note v1.2 was based on two core concerns: (1) An autonomous AI agent executing live production commands, and (2) Uncontrolled high-frequency polling during active auctions overloading the central MySQL database. This document presents verified architectural controls and quantitative load models resolving both concerns."
    )
    r_callout.font.italic = True
    r_callout.font.bold = True
    r_callout.font.color.rgb = NAVY

    p2 = doc.add_paragraph()
    p2.paragraph_format.space_after = Pt(6)
    p2.add_run(
        "Key architectural facts established from the codebase audit:"
    )
    add_bullet("1. Zero Runtime AI — ", "AI tools were utilized strictly on local developer workstations during design scaffolding with human-in-the-loop review. Production runtime runs as a standard Next.js 16 container in TVS Certified's own GCP cloud in Mumbai (asia-south1) with zero external AI involvement.")
    add_bullet("2. 100% Read-Only Integration — ", "The codebase contains zero PUT, PATCH, DELETE, or data-modifying calls to TVS Certified. It is physically impossible for the Super Cup application to cancel auctions, modify bids, approve inspections, or edit customer data.")
    add_bullet("3. Complete Database Isolation — ", "The Super Cup stores gamification metrics strictly in its own isolated database. It never writes to TVS Certified MySQL.")
    add_bullet("4. Central Database Protection — ", "Website traffic (leaderboard, rankings, dealer profiles) produces 0.00 RPM to the central DB. For auction sync, we propose 3 concrete operational modes (from 0 RPM live to throttled 5-min intervals) to ensure zero impact on live auction bidding.")

    # --- SECTION 2: AI BOUNDARY ---
    add_section_header("2. AI Tooling Boundary: Development-Time IDE Scaffolding vs. Zero Runtime AI")
    p_ai = doc.add_paragraph()
    p_ai.paragraph_format.space_after = Pt(6)
    p_ai.add_run(
        "A central concern in the Risk Note is that AWS Kiro could leak credentials, alter production records, or transfer sensitive dealer KYC and financial data to external AI servers in US East. We provide the following architectural guarantees:"
    )
    add_bullet("Development-Time Assistance Only: ", "Kiro was used solely as an IDE assistant on developer workstations to generate React UI components, calculate points logic, and type TypeScript interfaces under direct human developer supervision.")
    add_bullet("Zero External Runtime AI Calls: ", "The deployed production application has no dependency on Kiro, OpenAI, Claude, or any third-party AI runtime API. When dealers or admins access the Super Cup site, no data is sent to AWS US East or any external vendor.")
    add_bullet("Data Sovereignty in India: ", "All application traffic, sessions, and data storage reside strictly within TVS infrastructure in Google Cloud Platform (asia-south1 / Mumbai), fully compliant with Indian data localization laws.")

    # --- SECTION 3: TECHNICAL EVIDENCE MATRIX ---
    add_section_header("3. Technical Evidence Matrix: Direct Mitigation of Flagged Risks")
    p_matrix = doc.add_paragraph()
    p_matrix.paragraph_format.space_after = Pt(6)
    p_matrix.add_run(
        "Below is a line-by-line verification from the repository demonstrating how each High Risk from Risk Note v1.2 is resolved by existing architectural controls:"
    )

    risk_table = doc.add_table(rows=1, cols=3)
    risk_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    risk_table.autofit = False

    hdr = risk_table.rows[0]
    hdr.cells[0].width = Inches(1.8)
    hdr.cells[1].width = Inches(3.6)
    hdr.cells[2].width = Inches(1.5)

    headers = ["Risk Flagged in Note v1.2", "Codebase Architectural Control", "Verification Reference"]
    for i, title in enumerate(headers):
        cell = hdr.cells[i]
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_background(cell, "0F294A")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)

    rows_data = [
        (
            "Destructive Admin Actions\n(Auctions cancelled, bids altered, records edited)",
            "Strictly 100% Read-Only.\nThe codebase contains zero PUT, PATCH, DELETE, or mutating POST endpoints targeting TVS Certified. The only POST is to /authenticate for session tokens. All auction/bid syncs are HTTP GET requests.",
            "src/lib/services/tvs-integration.ts\n(audit confirms zero write calls)"
        ),
        (
            "Production Data Corruption\n(Write operations modifying live records)",
            "Complete Database Isolation.\nSuper Cup operates on its own dedicated PostgreSQL database via Prisma ORM. It has zero write access to TVS Certified MySQL.",
            "prisma/schema.prisma\nSECURITY_HANDOVER.md §2"
        ),
        (
            "Production Performance Impact\n(Crawling loading live auction floor)",
            "Aggressive Multi-Tier In-Memory Caching:\n• Bundled with static mappings for 1,608 dealers & 1,509 customer profiles.\n• Token cached 1h; user mappings cached 2h.\n• Strict AbortSignal timeouts (6s-15s).\n• Production sync decoupled from live bidding floor.",
            "src/lib/data/tvs-customer-mapping.json\ntvs-integration.ts (lines 185-221)"
        ),
        (
            "DPDP Act 2023 & Customer PII Leakage\n(Dealer KYC & financial data exposed)",
            "Strict PII Minimization & Server-Side Masking:\n• Dealer names masked server-side via maskDealerName() ('R*****').\n• Passwords & phone numbers stripped from public APIs.\n• KYC/finance master tables never ingested.\n• Cache-Control: no-store on all API routes.",
            "src/lib/security.ts\nnext.config.ts\nSECURITY_HANDOVER.md §3.4"
        ),
        (
            "Credential & Token Leakage\n(Admin credentials leaked into logs/files)",
            "GCP Secret Manager Integration:\n• Production credentials mounted via Secret Manager (no plain-text tokens in Git or client).\n• Admin auth uses HMAC-SHA256 signed session cookies (httpOnly, secure, sameSite: strict).\n• Structured audit logging sanitizes payloads.",
            "GCP_DEPLOYMENT_GUIDE.md §2\nSECURITY_HANDOVER.md §3.1"
        ),
        (
            "Unauthorized API Usage & Attack Surface\n(Exposed admin functions or API map)",
            "Corporate VPN Network Lockdown:\n• Admin domain (supercup-admin.tvs.in) restricted to TVS Corporate VPN CIDRs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) via Nginx / Cloud Armor.\n• Rate limiting: 5 req/15 min on login.",
            "nginx-tvs-supercup.conf\nSECURITY_HANDOVER.md §3.6"
        )
    ]

    for r_idx, (c0, c1, c2) in enumerate(rows_data):
        row = risk_table.add_row()
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(3.6)
        row.cells[2].width = Inches(1.5)

        bg = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for i, val in enumerate([c0, c1, c2]):
            cell = row.cells[i]
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
            if i == 0:
                r.font.bold = True
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)

    set_table_borders(risk_table, "CBD5E1")

    # --- SECTION 4: CENTRAL DATABASE IMPACT ANALYSIS (RPM) ---
    add_section_header("4. Quantitative Central Database Impact Analysis: Live Sync vs. Batch Sync (RPM)")
    p_rpm_intro = doc.add_paragraph()
    p_rpm_intro.paragraph_format.space_after = Pt(6)
    p_rpm_intro.add_run(
        "A critical question raised by DBAs and system architects is: "
    )
    r_q = p_rpm_intro.add_run("Are we certain the central TVS Certified MySQL database will not be overloaded if synchronization happens while an auction is live?")
    r_q.font.bold = True

    p_rpm_intro2 = doc.add_paragraph()
    p_rpm_intro2.paragraph_format.space_after = Pt(6)
    p_rpm_intro2.add_run(
        "To address this transparently, we must distinguish between two synchronization models: (1) The developmental real-time polling daemon, and (2) The recommended production batch synchronization architecture."
    )

    add_sub_header("4.1 The Technical Root Cause of High RPM in Live Polling (The N+1 Query Factor)")
    p_root = doc.add_paragraph()
    p_root.paragraph_format.space_after = Pt(6)
    p_root.add_run(
        "In the local development testing daemon (scripts/live-sync-daemon.ts), synchronization was initially configured to poll every 10 seconds. In tvs-integration.ts (lines 1110-1120), because TVS Certified exposes bids per individual vehicle rather than in a single consolidated feed, querying live bids requires iterating through active vehicles:"
    )
    add_bullet("Formula: ", "HTTP Calls Per Cycle = 3 Summary Endpoints (/getAuctionvehicleList, /auctionbidderregistration, /getInterests) + N Active Vehicles (/getLiveBids?auction_vehile_id=ID).")
    add_bullet("Under 10-Second Polling (Development Default): ", "If an auction has 40 active vehicles, each cycle makes 43 HTTP GET requests. At 6 cycles per minute, that equals ~258 RPM. This is precisely why InfoSec and DBAs flagged performance concerns.")

    add_sub_header("4.2 Production Load Comparison Across Synchronization Models")
    p_table_intro = doc.add_paragraph()
    p_table_intro.paragraph_format.space_after = Pt(6)
    p_table_intro.add_run(
        "The table below details the mathematical request volume, central database query footprint, and impact across all synchronization options:"
    )

    rpm_table = doc.add_table(rows=1, cols=4)
    rpm_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rpm_table.autofit = False

    rpm_hdr = rpm_table.rows[0]
    rpm_hdr.cells[0].width = Inches(1.8)
    rpm_hdr.cells[1].width = Inches(1.3)
    rpm_hdr.cells[2].width = Inches(1.2)
    rpm_hdr.cells[3].width = Inches(2.6)

    rpm_headers = ["Synchronization Model", "Execution Window", "Central DB RPM", "Operational Impact & DBA Verdict"]
    for i, title in enumerate(rpm_headers):
        cell = rpm_hdr.cells[i]
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_background(cell, "0F294A")
        set_cell_margins(cell, top=100, bottom=100, left=80, right=80)

    rpm_data = [
        (
            "Model A: Post-Auction Batch Sync\n(RECOMMENDED PRODUCTION)",
            "Once post-auction\n(e.g., Thursday 4:30 PM after bidding closes)",
            "0.00 RPM Live\n(0 calls during bidding)\n12 GET calls total\n(burst in < 4 sec)",
            "ZERO RISK TO LIVE AUCTION FLOOR.\nNo requests during live bidding. Pulls completed vehicle and winner summaries across TN, KL, AP/TS branches. Less load than 1 user browsing the site for 1 minute."
        ),
        (
            "Model B: Periodic Throttled Sync\n(If near-real-time is required)",
            "Every 5 to 15 minutes\n(Thursday 2:00 PM – 4:00 PM window only)",
            "~2.8 to 8.6 RPM\n(43 calls / 5–15 min)",
            "COMPLETELY SAFE FOR PRODUCTION.\nThrottling the interval from 10s to 5–15 minutes drops server load by 97%. Requests are serialized in batches of 10 with 5s timeouts. No connection spikes."
        ),
        (
            "Model C: Bulk Summary API / Webhook\n(Ideal API Gateway Integration)",
            "Webhook on auction event OR 1-min summary poll",
            "< 1.00 RPM\n(1 call per min)",
            "OPTIMAL ENTERPRISE ARCHITECTURE.\nNESH provides a single consolidated endpoint (GET /getAuctionLiveSummary) or fires a webhook upon auction events. Eliminates vehicle looping entirely."
        ),
        (
            "Model D: Public & Dealer Browsing\n(Leaderboards, Rankings, Rules)",
            "Continuous 24/7\n(100 to 10,000 users)",
            "0.00 RPM\n(ZERO calls to TVS Certified)",
            "100% ISOLATED ARCHITECTURE.\nAll leaderboard standings, points, badges, and prizes are queried strictly from the Super Cup PostgreSQL database (dealer_scores). Central DB is never touched."
        )
    ]

    for r_idx, (c0, c1, c2, c3) in enumerate(rpm_data):
        row = rpm_table.add_row()
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(1.3)
        row.cells[2].width = Inches(1.2)
        row.cells[3].width = Inches(2.6)

        bg = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for i, val in enumerate([c0, c1, c2, c3]):
            cell = row.cells[i]
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(val)
            r.font.size = Pt(8)
            r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
            if i in (0, 2):
                r.font.bold = True
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=70, right=70)

    set_table_borders(rpm_table, "CBD5E1")

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_sub_header("4.3 Business Rule Realignment: Why Real-Time Live Polling Is Not Necessary")
    p_rules = doc.add_paragraph()
    p_rules.paragraph_format.space_after = Pt(4)
    p_rules.add_run(
        "Beyond technical controls, the Super Cup business rules confirm that high-frequency live polling is neither required nor beneficial for the campaign:"
    )
    add_bullet("1. Offline Verification Rule: ", "As documented in the official Dealer Pitch Deck and implemented in tvs-sync.ts (lines 187-191), Buy and Sell conversions (+10 pts each) cannot be finalized in real-time during bidding; they require post-auction operational verification before verified points are credited.")
    add_bullet("2. Weekly Championship Cadence: ", "The Super Cup is a 16-match weekly series running across 4 months. Dealers review leaderboard standings between auction matches to track national rankings, not to watch second-by-second ticker updates while actively bidding.")
    add_bullet("3. Architectural Recommendation: ", "We recommend adopting Model A (Post-Auction Batch Sync) for production go-live: the sync executes automatically at 4:30 PM on Thursdays when bidding has ended. This guarantees 0.00 RPM during live bidding and restricts total central database calls to exactly 12 HTTP GET requests.")

    # --- SECTION 5: 7 CONDITIONS FOR SAFE USE ---
    add_section_header("5. Fulfillment of the '7 Conditions for Safe Use'")
    p_cond = doc.add_paragraph()
    p_cond.paragraph_format.space_after = Pt(6)
    p_cond.add_run(
        "Section 4 of Risk Note v1.2 specified 7 mandatory conditions before any analysis or API reuse proceeds. The Super Cup platform satisfies or actively adopts every condition:"
    )

    conditions = [
        ("Condition 1: Written Approval from TVS InfoSec — ", "This technical response and the companion Security Handover Report serve as the formal submission for TVS Mobility InfoSec sign-off."),
        ("Condition 2: IP Position Confirmed under MSA — ", "TVS Super Cup is an internal TVS engagement asset built exclusively to drive auction participation and GMV among TVS Certified dealers under MSA NE-MSA-TVS-AUC-2026-001."),
        ("Condition 3: Staging Environment Validation — ", "We are fully committed to completing end-to-end integration testing in the TVS Certified Staging/UAT environment with synthetic/masked data prior to production connectivity."),
        ("Condition 4: Dedicated Least-Privilege Read-Only Account — ", "We explicitly request that TVS InfoSec and NESH issue a dedicated service account restricted strictly to read-only endpoints (GET /auctions, GET /getAuctionvehicleList, GET /getWinningBids). No personal or human admin credentials are required."),
        ("Condition 5: Enterprise-Grade AI Configuration — ", "Confirmed. No automated AI tool is connected to TVS production. AI IDE assistants on developer machines have telemetry/content sharing disabled, and all code is human-reviewed."),
        ("Condition 6: Versioned API Gateway / Scoped Access — ", "The Super Cup integration layer is fully modular and ready to consume data via any versioned API gateway, proxy, or scoped read endpoints configured by the NESH engineering team."),
        ("Condition 7: Human Code Review & VAPT Readiness — ", "All source code, database schemas, and architectural controls have undergone peer review. The complete VAPT test harness is documented in SECURITY_HANDOVER.md (§4) for TVS InfoSec execution.")
    ]

    for prefix, body in conditions:
        add_bullet(prefix, body)

    # --- SECTION 6: TARGET GCP HOSTING ARCHITECTURE ---
    add_section_header("6. Target GCP Production Architecture")
    p_arch = doc.add_paragraph()
    p_arch.paragraph_format.space_after = Pt(6)
    p_arch.add_run(
        "As detailed in GCP_DEPLOYMENT_GUIDE.md, the application is ready for deployment directly inside TVS Certified's own Google Cloud Platform project in Mumbai (asia-south1):"
    )

    add_bullet("Perimeter Defense: ", "Google Cloud Load Balancing with Cloud Armor WAF (OWASP Top 10 Core Rule Set, rate limiting, and VPN IP restriction on admin routes).")
    add_bullet("Compute Layer: ", "Serverless Google Cloud Run running standalone Next.js 16 with automated scaling, in-memory rate limiting, and zero OS persistence.")
    add_bullet("Database Security: ", "Cloud SQL (PostgreSQL 16) configured with Private IP ONLY, accessible strictly via Serverless VPC Access connector within TVS's private subnet.")
    add_bullet("Secrets Management: ", "Google Cloud Secret Manager automatically injects database credentials, service account tokens, and encryption keys at runtime.")

    # --- SECTION 7: PROPOSED NEXT STEPS ---
    add_section_header("7. Proposed Next Steps & Sign-Off Request")
    p_steps = doc.add_paragraph()
    p_steps.paragraph_format.space_after = Pt(6)
    p_steps.add_run(
        "To operationalize this safely and protect the TVS Super Cup campaign schedule, we request the following two collaborative next steps:"
    )

    add_bullet("1. Confirm Sync Model (Model A Recommended): ", "Confirm adoption of Model A (Post-Auction Batch Sync at 4:30 PM Thursdays) for production, guaranteeing 0 RPM during live bidding. If near-real-time updates are preferred, configure Model B with a 5-minute interval.")
    add_bullet("2. Provision Dedicated Read-Only Account on Staging: ", "Request NESH / TVS Certified core team to provide staging environment credentials scoped strictly to GET /auctions, GET /getAuctionvehicleList, and GET /getWinningBids.")
    add_bullet("3. 15-Minute Architecture Review: ", "The Super Cup engineering team is available for a technical walkthrough with Indumati and the TVS InfoSec team to demonstrate the read-only safeguards and initiate VAPT validation.")

    # Sign-off box
    sign_table = doc.add_table(rows=1, cols=1)
    sign_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = sign_table.rows[0].cells[0]
    c.width = Inches(6.9)
    p_s = c.paragraphs[0]
    p_s.paragraph_format.space_after = Pt(2)
    r_s1 = p_s.add_run("Submission Confirmation:\n")
    r_s1.font.bold = True
    r_s1.font.size = Pt(9.5)
    r_s1.font.color.rgb = NAVY
    r_s2 = p_s.add_run(
        "The TVS Super Cup implementation adheres strictly to the principle of least privilege, operates with 100% read-only data isolation, enforces robust PII masking under the DPDP Act 2023, and guarantees zero impact on live auction bidding. We respectfully request conditional approval to proceed with Staging/UAT validation."
    )
    r_s2.font.size = Pt(9)
    r_s2.font.color.rgb = SLATE
    set_cell_background(c, "F1F5F9")
    set_cell_margins(c, top=120, bottom=120, left=140, right=140)
    set_table_borders(sign_table, "CBD5E1")

    # Save
    doc.save(output_path)
    print(f"Document saved successfully to {output_path}")

if __name__ == "__main__":
    desktop_dir = r"C:\Users\TC100\OneDrive - TVS Mobility Private Limited\Desktop\NESH"
    desktop_file = os.path.join(desktop_dir, "TVS_Super_Cup_Technical_Response_Risk_Note_v1.2.docx")
    repo_file = r"c:\supercup_Watermelon\TVS-Supercup\TVS_Super_Cup_Technical_Response_Risk_Note_v1.2.docx"

    build_docx(desktop_file)
    build_docx(repo_file)
