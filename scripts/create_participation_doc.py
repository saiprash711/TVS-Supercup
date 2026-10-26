import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=50, bottom=50, left=90, right=90):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_word_doc(output_path):
    doc = docx.Document()
    
    # Page Setup: A4, 0.42 inch margins for a sleek, compact 1-2 page layout
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.42)
        section.bottom_margin = Inches(0.42)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)
        
        # Header / Footer
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("TVS Certified Dealer Super Cup • Official Participation Rules • Exclusive Jurisdiction: Madhavaram Office, Chennai")
        f_run.font.name = "Arial"
        f_run.font.size = Pt(7)
        f_run.font.color.rgb = RGBColor(148, 163, 184)

    # Color Palette
    COLOR_PRIMARY = RGBColor(30, 58, 138)   # #1E3A8A Navy
    COLOR_DARK = RGBColor(15, 23, 42)       # #0F172A Dark Slate
    COLOR_ACCENT = RGBColor(185, 28, 28)    # #B91C1C TVS Red
    COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B Slate

    # ── HEADER TITLE BLOCK ──
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(1)
    title_p.paragraph_format.line_spacing = 1.05
    
    t_badge = title_p.add_run("TVS CERTIFIED AUTOMOTIVE VENTURES\n")
    t_badge.font.name = "Arial"
    t_badge.font.size = Pt(8)
    t_badge.font.bold = True
    t_badge.font.color.rgb = COLOR_ACCENT

    t_main = title_p.add_run("TVS CERTIFIED DEALER SUPER CUP")
    t_main.font.name = "Arial"
    t_main.font.size = Pt(15)
    t_main.font.bold = True
    t_main.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(4)
    sub_run = sub_p.add_run("Official Participation Guidelines, Exact Scoring Allocation & Key Legal Terms")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(8.5)
    sub_run.font.color.rgb = COLOR_MUTED

    # Metadata bar table
    meta_table = doc.add_table(rows=1, cols=3)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    col_widths = [Inches(2.4), Inches(2.4), Inches(2.47)]
    for i, w in enumerate(col_widths):
        meta_table.columns[i].width = w
        cell = meta_table.rows[0].cells[i]
        cell.width = w
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)

    cell_items = [
        ("CAMPAIGN PERIOD", "[Day X] [Month X] to [Day X] [Month X], [Year X]"),
        ("TOTAL PRIZE POOL", "₹1,00,000 Guaranteed Cash Awards"),
        ("EXCLUSIVE JURISDICTION", "TVS Certified Madhavaram Office, Chennai")
    ]
    for i, (k, v) in enumerate(cell_items):
        cell_p = meta_table.rows[0].cells[i].paragraphs[0]
        cell_p.paragraph_format.space_before = Pt(0)
        cell_p.paragraph_format.space_after = Pt(0)
        r1 = cell_p.add_run(k + "\n")
        r1.font.name = "Arial"
        r1.font.size = Pt(6.5)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_PRIMARY
        r2 = cell_p.add_run(v)
        r2.font.name = "Arial"
        r2.font.size = Pt(7.5)
        r2.font.bold = (i == 1 or i == 2)
        r2.font.color.rgb = COLOR_DARK if i != 2 else COLOR_ACCENT

    def add_section_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1.5)
        run = p.add_run(title)
        run.font.name = "Arial"
        run.font.size = Pt(9.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_bullet_item(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0.5)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.line_spacing = 1.08
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = "Arial"
        r_bold.font.size = Pt(8)
        r_bold.font.bold = True
        r_bold.font.color.rgb = COLOR_DARK
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(8)
        r_text.font.color.rgb = COLOR_DARK
        return p

    # ── SECTION 1: HOW TO PARTICIPATE & DEALER ELIGIBILITY ──
    add_section_header("1. HOW TO PARTICIPATE & DEALER ELIGIBILITY")
    add_bullet_item(
        "Existing TVS Certified Dealers (Already Eligible): ",
        "All dealerships that are already registered, verified, and operational within the TVS Certified network are AUTOMATICALLY ELIGIBLE. No separate contest registration application or fee is required. Existing dealers have immediate active access to participate across both buying and selling leagues upon campaign launch."
    )
    add_bullet_item(
        "New Dealerships (Mandatory Onboarding Required): ",
        "Any prospective or unregistered dealership must first complete the formal TVS Certified onboarding protocol—including business documentation, KYC, commercial bank account verification, and dealer franchise clearance. Once successfully onboarded and activated on the network, new dealers are immediately qualified and unlocked to participate in the Super Cup."
    )
    add_bullet_item(
        "Direct Portal Access: ",
        "Dealers access match sessions, track point accruals, and view live dual-league leaderboard standings directly via their authorized TVS mobile portal credentials."
    )

    # ── SECTION 2: CAMPAIGN LENGTH & DURATION ──
    add_section_header("2. CAMPAIGN LENGTH, DURATION & SESSIONS")
    add_bullet_item(
        "Campaign Length & Duration: ",
        "The tournament operates over a designated period of [X] weeks (or [X] months), commencing on [Day X] of [Month X], [Year X] and concluding on [Day X] of [Month X], [Year X] ('Tournament Period')."
    )
    add_bullet_item(
        "Weekly Match Cadence: ",
        "The competition consists of a series of [X] official weekly live auction matches scheduled every Thursday promptly at [X:XX] [AM/PM] IST on the central auction portal."
    )
    add_bullet_item(
        "Telemetry Verification: ",
        "Points are credited strictly for verified bidding, logins, and listings recorded within designated session windows by the TVS Central Telemetry Engine."
    )

    # ── SECTION 3: EXACT POINT ALLOCATION PROTOCOL (DUAL LEAGUE) ──
    add_section_header("3. EXACT POINT ALLOCATION PROTOCOL (DUAL LEAGUE)")
    p_sep = doc.add_paragraph()
    p_sep.paragraph_format.space_before = Pt(0)
    p_sep.paragraph_format.space_after = Pt(2)
    r_sep = p_sep.add_run(
        "Points are maintained in two completely independent divisions. Buyer Points and Seller Points are NEVER combined or summed. Dealers can compete and win podium awards in either or both leagues with the following exact points:"
    )
    r_sep.font.name = "Arial"
    r_sep.font.size = Pt(7.5)
    r_sep.font.italic = True
    r_sep.font.color.rgb = COLOR_MUTED

    # Points Table with EXACT Numbers
    pts_table = doc.add_table(rows=6, cols=3)
    pts_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pts_table.autofit = False
    set_table_borders(pts_table, color="CBD5E1", sz="4")

    pts_widths = [Inches(1.4), Inches(4.37), Inches(1.5)]
    for i, w in enumerate(pts_widths):
        pts_table.columns[i].width = w

    headers = ["League", "Activity & Scoring Criteria", "Exact Points Awarded"]
    for i, h in enumerate(headers):
        cell = pts_table.rows[0].cells[i]
        cell.width = pts_widths[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(h)
        run.font.name = "Arial"
        run.font.size = Pt(7.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    pts_rows = [
        ("BUYER LEAGUE", "Live Auction Bids (Per-Car Basis):\nSubmitting verified bid(s) on a unique car lot during scheduled matches. Multiple bids on the same car do not yield extra points (prevents point farming).", "1 Point per Unique Car"),
        ("BUYER LEAGUE", "Match-Day Attendance:\nLogging in and actively participating in an official weekly Thursday auction session.", "1 Point per Match Day"),
        ("BUYER LEAGUE", "All-Matches Attendance Bonus:\nMaintaining 100% flawless attendance across all [X] official weekly tournament matches.", "+20 Bonus Points (Season End)"),
        ("SELLER LEAGUE", "Vehicle Consignment Listing:\nSubmitting, inspecting, and publishing a verified vehicle into the official auction catalog.", "5 Points per Published Car"),
        ("SELLER LEAGUE", "Commission Settlement:\nSuccessfully closing and settling transaction fees within [X] banking business days.", "5 Points per Settled Deal")
    ]

    for row_idx, (div, act, pts) in enumerate(pts_rows, start=1):
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, val in enumerate([div, act, pts]):
            cell = pts_table.rows[row_idx].cells[col_idx]
            cell.width = pts_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            run = p.add_run(val)
            run.font.name = "Arial"
            run.font.size = Pt(7)
            if col_idx == 0:
                run.font.bold = True
                run.font.color.rgb = COLOR_PRIMARY if "BUYER" in val else RGBColor(2, 132, 199)
            elif col_idx == 2:
                run.font.bold = True
                run.font.color.rgb = RGBColor(185, 28, 28) if "+20" in val else COLOR_PRIMARY
            else:
                run.font.color.rgb = COLOR_DARK

    # ── SECTION 4: PRIZE PURSE & PODIUM DISTRIBUTION ──
    add_section_header("4. GUARANTEED PRIZE PURSE & TIE-BREAKER POLICY")
    add_bullet_item(
        "Grand Prize Pool (₹1,00,000): ",
        "Guaranteed cash awards purse of ₹1,00,000 (Rupees One Lakh) divided equally: ₹50,000 for Buyer League and ₹50,000 for Seller League."
    )

    prize_table = doc.add_table(rows=4, cols=4)
    prize_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    prize_table.autofit = False
    set_table_borders(prize_table, color="CBD5E1", sz="4")
    
    prz_widths = [Inches(1.8), Inches(1.8), Inches(1.8), Inches(1.87)]
    for i, w in enumerate(prz_widths):
        prize_table.columns[i].width = w

    prz_headers = ["Podium Tier", "Buyer League Award", "Seller League Award", "Ceremonial Award"]
    for i, h in enumerate(prz_headers):
        cell = prize_table.rows[0].cells[i]
        cell.width = prz_widths[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(h)
        run.font.name = "Arial"
        run.font.size = Pt(7.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    prz_data = [
        ("1st Place (Champion)", "₹25,000 Cash Purse", "₹25,000 Cash Purse", "Official TVS Trophy"),
        ("2nd Place (Runner-Up)", "₹15,000 Cash Purse", "₹15,000 Cash Purse", "Silver Plaque"),
        ("3rd Place (2nd Runner-Up)", "₹10,000 Cash Purse", "₹10,000 Cash Purse", "Bronze Plaque")
    ]
    for row_idx, (tier, b_prz, s_prz, award) in enumerate(prz_data, start=1):
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, val in enumerate([tier, b_prz, s_prz, award]):
            cell = prize_table.rows[row_idx].cells[col_idx]
            cell.width = prz_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(val)
            run.font.name = "Arial"
            run.font.size = Pt(7)
            if col_idx in [1, 2]:
                run.font.bold = True
                run.font.color.rgb = RGBColor(22, 101, 52)
            elif col_idx == 0:
                run.font.bold = True
                run.font.color.rgb = COLOR_DARK
            else:
                run.font.color.rgb = COLOR_MUTED

    add_bullet_item(
        "Equal Points Tie-Breaker (Split Purse Formula): ",
        "If dealerships tie on points at season end for any podium rank, the combined prize purse of tied spots is divided equally (e.g. 2-way tie for 1st splits ₹40,000 = ₹20,000 each; 3-way tie for 1st splits ₹50,000 = ₹16,666.67 each; 2-way tie for 2nd splits ₹25,000 = ₹12,500 each; 2-way tie for 3rd splits ₹10,000 = ₹5,000 each). No subjective tie-breakers are used."
    )

    # ── SECTION 5: DISPUTE JURISDICTION RESTRICTED TO MADHAVARAM OFFICE ──
    add_section_header("5. GOVERNING LAW & JURISDICTION RESTRICTED TO MADHAVARAM OFFICE")
    
    callout_table = doc.add_table(rows=1, cols=1)
    callout_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    callout_table.autofit = False
    callout_cell = callout_table.rows[0].cells[0]
    callout_cell.width = Inches(7.27)
    set_cell_background(callout_cell, "FEF2F2")
    set_cell_margins(callout_cell, top=50, bottom=50, left=90, right=90)
    
    tcPr = callout_cell._tc.get_or_add_tcPr()
    callout_borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="B91C1C"/>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="FECACA"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="FECACA"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="FECACA"/>
        </w:tcBorders>
    ''')
    tcPr.append(callout_borders)

    c_p1 = callout_cell.paragraphs[0]
    c_p1.paragraph_format.space_before = Pt(0)
    c_p1.paragraph_format.space_after = Pt(1.5)
    r_c1 = c_p1.add_run("CRITICAL JURISDICTION CLAUSE — TVS CERTIFIED MADHAVARAM OFFICE, CHENNAI")
    r_c1.font.name = "Arial"
    r_c1.font.size = Pt(8)
    r_c1.font.bold = True
    r_c1.font.color.rgb = COLOR_ACCENT

    c_p2 = callout_cell.add_paragraph()
    c_p2.paragraph_format.space_before = Pt(0)
    c_p2.paragraph_format.space_after = Pt(2)
    c_p2.paragraph_format.line_spacing = 1.1
    r_c2 = c_p2.add_run(
        "In case of any conflicts, disputes, differences, controversies, scoring grievances, eligibility claims, or interpretation questions arising out of or in connection with the TVS Certified Dealer Super Cup, the matter shall be strictly referred to and subjected exclusively to the administrative governance, review, and final decision of the "
    )
    r_c2.font.name = "Arial"
    r_c2.font.size = Pt(7.5)
    r_c2.font.color.rgb = COLOR_DARK
    
    r_c2_bold = c_p2.add_run("TVS CERTIFIED MADHAVARAM OFFICE, CHENNAI")
    r_c2_bold.font.name = "Arial"
    r_c2_bold.font.size = Pt(7.5)
    r_c2_bold.font.bold = True
    r_c2_bold.font.color.rgb = COLOR_PRIMARY

    r_c2_end = c_p2.add_run(
        ". The audit trail of the central TVS telemetry engine shall be final, and determinations issued by the TVS Certified Madhavaram Office, Chennai shall be conclusive, final, and legally binding across all participating dealerships."
    )
    r_c2_end.font.name = "Arial"
    r_c2_end.font.size = Pt(7.5)
    r_c2_end.font.color.rgb = COLOR_DARK

    c_p3 = callout_cell.add_paragraph()
    c_p3.paragraph_format.space_before = Pt(1)
    c_p3.paragraph_format.space_after = Pt(0)
    r_c3 = c_p3.add_run(
        "Designated Escalation Office: TVS Certified — Madhavaram Regional Hub, Madhavaram, Chennai, Tamil Nadu, India. Written notice window: within [X] business days of affected match session."
    )
    r_c3.font.name = "Arial"
    r_c3.font.size = Pt(6.5)
    r_c3.font.italic = True
    r_c3.font.color.rgb = COLOR_MUTED

    # Try primary path, fallback to timestamped or alternate if locked by Word
    saved_path = output_path
    try:
        doc.save(output_path)
        print(f"Word Document successfully saved to: {output_path}")
    except PermissionError:
        base, ext = os.path.splitext(output_path)
        saved_path = f"{base}_Exact_Points{ext}"
        doc.save(saved_path)
        print(f"Original file was open in Word. Saved updated file to: {saved_path}")
    return saved_path

if __name__ == "__main__":
    out_file = r"c:\supercup_Watermelon\TVS-Supercup\TVS_Super_Cup_Participation_Terms.docx"
    build_word_doc(out_file)
