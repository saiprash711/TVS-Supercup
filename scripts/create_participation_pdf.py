import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class OnePageCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica-Bold", 6.5)
        self.setFillColor(colors.HexColor("#64748B"))
        footer_text = "TVS Certified Dealer Super Cup • Official Participation & Legal Guidelines • Exclusive Dispute Authority: Madhavaram Office, Chennai"
        self.drawString(28, 16, footer_text)
        self.drawRightString(A4[0] - 28, 16, f"Official Regulatory Document • Page {self._pageNumber} of {total_pages}")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(28, 24, A4[0] - 28, 24)
        self.restoreState()

def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=28,
        rightMargin=28,
        topMargin=26,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    style_eyebrow = ParagraphStyle(
        'Eyebrow', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=7, leading=8.5,
        textColor=colors.HexColor('#B91C1C'), spaceAfter=1
    )
    
    style_title = ParagraphStyle(
        'MainTitle', parent=styles['Title'],
        fontName='Helvetica-Bold', fontSize=14, leading=16,
        textColor=colors.HexColor('#1E3A8A'), alignment=0, spaceAfter=1
    )

    style_sub = ParagraphStyle(
        'Subtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.5, leading=9.5,
        textColor=colors.HexColor('#64748B'), spaceAfter=4
    )

    style_sec_header = ParagraphStyle(
        'SecHeader', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=10.5,
        textColor=colors.HexColor('#1E3A8A'), spaceBefore=3.5, spaceAfter=2
    )

    style_body = ParagraphStyle(
        'BodyCustom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7, leading=8.8,
        textColor=colors.HexColor('#0F172A'), spaceAfter=1.5
    )

    style_bullet = ParagraphStyle(
        'BulletCustom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7, leading=8.8,
        textColor=colors.HexColor('#0F172A'), leftIndent=8, firstLineIndent=-8, spaceAfter=1.5
    )

    style_table_header = ParagraphStyle(
        'TH', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=6.5, leading=8,
        textColor=colors.white, alignment=1
    )

    style_table_cell = ParagraphStyle(
        'TC', parent=styles['Normal'],
        fontName='Helvetica', fontSize=6.5, leading=7.8,
        textColor=colors.HexColor('#0F172A')
    )

    style_table_cell_bold = ParagraphStyle(
        'TCB', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=6.5, leading=8,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Title Banner
    story.append(Paragraph("TVS CERTIFIED AUTOMOTIVE VENTURES", style_eyebrow))
    story.append(Paragraph("TVS CERTIFIED DEALER SUPER CUP", style_title))
    story.append(Paragraph("Official Participation Guidelines, Exact Scoring Allocation & Key Legal Terms", style_sub))

    # Metadata Strip Table
    meta_data = [
        [
            Paragraph("<b>CAMPAIGN PERIOD</b><br/><font color='#0F172A'>[Day X] [Month X] to [Day X] [Month X], [Year X]</font>", style_table_cell),
            Paragraph("<b>TOTAL PRIZE POOL</b><br/><font color='#166534'><b>₹1,00,000 Guaranteed Cash Awards</b></font>", style_table_cell),
            Paragraph("<b>EXCLUSIVE JURISDICTION</b><br/><font color='#B91C1C'><b>TVS Certified Madhavaram Office, Chennai</b></font>", style_table_cell)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[179, 179, 181])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 3))

    # ── SECTION 1: HOW TO PARTICIPATE & DEALER ELIGIBILITY ──
    story.append(Paragraph("1. HOW TO PARTICIPATE & DEALER ELIGIBILITY", style_sec_header))
    story.append(Paragraph(
        "• <b>Existing TVS Certified Dealers (Already Eligible):</b> All dealerships currently registered, verified, and active within the TVS Certified dealer network are <b>automatically eligible</b>. No separate enrollment application or registration fee is required. Existing dealers have immediate active access to participate across both buying and selling leagues upon campaign launch.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>New Dealerships (Mandatory Onboarding Required):</b> Any new or prospective dealership must first complete the official <b>TVS Certified Onboarding Protocol</b>—including submission and verification of business KYC, PAN, GSTIN, verified commercial bank account details, and franchise empanelment. Upon successful onboarding into the TVS Certified network, new dealers are immediately qualified and unlocked to participate in the Super Cup.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Real-Time Access:</b> Participating dealers log into official Thursday auction sessions and track point tallies and live dual-league standings directly via their authorized TVS mobile portal credentials.",
        style_bullet
    ))

    # ── SECTION 2: CAMPAIGN LENGTH & DURATION ──
    story.append(Paragraph("2. CAMPAIGN LENGTH, DURATION & MATCH SESSIONS", style_sec_header))
    story.append(Paragraph(
        "• <b>Tournament Term:</b> The Super Cup campaign operates over a designated period of <b>[X] weeks (or [X] months)</b>, commencing on <b>[Day X] [Month X], [Year X]</b> and concluding on <b>[Day X] [Month X], [Year X]</b> ('Tournament Period').",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Weekly Auction Cadence:</b> The tournament comprises <b>[X] official weekly live auction matches</b>, conducted every Thursday promptly at <b>[X:XX] [AM/PM] IST</b> on the centralized auction portal.",
        style_bullet
    ))
    story.append(Paragraph(
        "• <b>Server Telemetry Verification:</b> Points are credited strictly for verified bidding, logins, and listings recorded within designated session windows by the TVS Central Telemetry Engine.",
        style_bullet
    ))

    # ── SECTION 3: EXACT POINT ALLOCATION (DUAL LEAGUE) ──
    story.append(Paragraph("3. EXACT POINT ALLOCATION PROTOCOL (DUAL LEAGUE)", style_sec_header))
    story.append(Paragraph(
        "<i>Points in the Buyer League and Seller League are strictly separated and NEVER combined or summed. Dealers compete and win podium prizes in either or both leagues with the following exact points:</i>",
        style_body
    ))

    pts_data = [
        [Paragraph("Division", style_table_header), Paragraph("Activity & Allocation Rule", style_table_header), Paragraph("Exact Points Awarded", style_table_header)],
        [
            Paragraph("<b>BUYER LEAGUE</b>", style_table_cell_bold),
            Paragraph("<b>Live Auction Bids (Per-Car Basis):</b> Submitting verified bid(s) on a unique car lot during scheduled matches. Multiple bids on the same car lot award <u>no extra points</u> (anti-farming rule).", style_table_cell),
            Paragraph("<b>1 Point</b><br/>per unique vehicle", style_table_cell)
        ],
        [
            Paragraph("<b>BUYER LEAGUE</b>", style_table_cell_bold),
            Paragraph("<b>Match-Day Attendance:</b> Logging in and actively participating in an official weekly Thursday auction session.", style_table_cell),
            Paragraph("<b>1 Point</b><br/>per match day", style_table_cell)
        ],
        [
            Paragraph("<b>BUYER LEAGUE</b>", style_table_cell_bold),
            Paragraph("<b>All-Matches Attendance Bonus:</b> Maintaining 100% flawless attendance across all [X] official weekly tournament matches.", style_table_cell),
            Paragraph("<font color='#B91C1C'><b>+20 Bonus Points</b></font><br/>at season end", style_table_cell)
        ],
        [
            Paragraph("<b>SELLER LEAGUE</b>", style_table_cell_bold),
            Paragraph("<b>Vehicle Consignment Listings:</b> Consigning, inspecting, and publishing a verified vehicle into the official auction catalog.", style_table_cell),
            Paragraph("<b>5 Points</b><br/>per published car", style_table_cell)
        ],
        [
            Paragraph("<b>SELLER LEAGUE</b>", style_table_cell_bold),
            Paragraph("<b>Commission Settlements:</b> Closing and settling platform transaction commission within [X] banking days of auction close.", style_table_cell),
            Paragraph("<b>5 Points</b><br/>per settled deal", style_table_cell)
        ],
    ]
    t_pts = Table(pts_data, colWidths=[90, 335, 114])
    t_pts.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_pts)
    story.append(Spacer(1, 3))

    # ── SECTION 4: GUARANTEED PRIZES & TIE-BREAKER POLICY ──
    story.append(Paragraph("4. GUARANTEED PRIZE PURSE & TIE-BREAKER POLICY", style_sec_header))
    story.append(Paragraph(
        "• <b>Total Guaranteed Prize Purse:</b> <b>₹1,00,000</b> (Rupees One Lakh Only) total cash awards, divided equally: <b>₹50,000</b> for Buyer League and <b>₹50,000</b> for Seller League.",
        style_bullet
    ))

    prz_data = [
        [
            Paragraph("Podium Tier", style_table_header),
            Paragraph("Buyer League Purse", style_table_header),
            Paragraph("Seller League Purse", style_table_header),
            Paragraph("Ceremonial Award", style_table_header)
        ],
        [
            Paragraph("<b>1st Place (Champion)</b>", style_table_cell_bold),
            Paragraph("<font color='#166534'><b>₹25,000 Cash</b></font>", style_table_cell),
            Paragraph("<font color='#166534'><b>₹25,000 Cash</b></font>", style_table_cell),
            Paragraph("Official TVS Trophy", style_table_cell)
        ],
        [
            Paragraph("<b>2nd Place (Runner-Up)</b>", style_table_cell_bold),
            Paragraph("<font color='#166534'><b>₹15,000 Cash</b></font>", style_table_cell),
            Paragraph("<font color='#166534'><b>₹15,000 Cash</b></font>", style_table_cell),
            Paragraph("Silver Plaque", style_table_cell)
        ],
        [
            Paragraph("<b>3rd Place (2nd Runner-Up)</b>", style_table_cell_bold),
            Paragraph("<font color='#166534'><b>₹10,000 Cash</b></font>", style_table_cell),
            Paragraph("<font color='#166534'><b>₹10,000 Cash</b></font>", style_table_cell),
            Paragraph("Bronze Plaque", style_table_cell)
        ],
    ]
    t_prz = Table(prz_data, colWidths=[130, 135, 135, 139])
    t_prz.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (1,1), (2,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_prz)

    story.append(Paragraph(
        "• <b>Equal Points Tie-Breaker (Split Purse Formula):</b> If dealerships tie on points at season end for any podium spot, the combined cash purse of the tied spots is divided equally (e.g. 2-way tie for 1st splits ₹40,000 = ₹20,000 each; 3-way tie for 1st splits ₹50,000 = ₹16,666.67 each; 2-way tie for 2nd splits ₹25,000 = ₹12,500 each; 2-way tie for 3rd splits ₹10,000 = ₹5,000 each). No subjective tie-breakers are used.",
        style_bullet
    ))
    story.append(Spacer(1, 3))

    # ── SECTION 5: GOVERNING LAW & MADHAVARAM JURISDICTION ──
    story.append(Paragraph("5. GOVERNING LAW & JURISDICTION RESTRICTED TO MADHAVARAM OFFICE", style_sec_header))
    
    jurisdiction_html = (
        "<b>CRITICAL MANDATORY JURISDICTION CLAUSE:</b><br/>"
        "In case of any conflicts, disputes, differences, controversies, scoring grievances, eligibility claims, or interpretation challenges arising out of or in connection with the TVS Certified Dealer Super Cup, <b>the matter shall be strictly referred to and subjected exclusively to the administrative governance, review, and final decision of the TVS CERTIFIED MADHAVARAM OFFICE, CHENNAI</b>.<br/>"
        "The immutable records and audit trail of the central TVS auction engine shall be final, and determinations issued by the TVS Certified Madhavaram Office, Chennai shall be conclusive, final, and legally binding on all participating dealerships.<br/>"
        "<font size='6' color='#64748B'><i>Designated Compliance Escalation Hub: TVS Certified — Madhavaram Regional Office, Madhavaram, Chennai, Tamil Nadu, India. Grievance submission window: within [X] business days of the relevant auction session.</i></font>"
    )
    
    t_callout = Table([[Paragraph(jurisdiction_html, style_body)]], colWidths=[539])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF2F2')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#FECACA')),
        ('LINEBEFORE', (0,0), (0,0), 3, colors.HexColor('#B91C1C')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_callout)

    doc.build(story, canvasmaker=OnePageCanvas)
    print(f"PDF successfully saved with exact points to: {output_path}")

if __name__ == "__main__":
    out_file = r"c:\supercup_Watermelon\TVS-Supercup\TVS_Super_Cup_Participation_Terms.pdf"
    build_pdf(out_file)
