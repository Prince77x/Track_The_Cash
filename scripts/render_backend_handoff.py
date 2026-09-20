from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "backend-frontend-handoff.md"
OUTPUT = ROOT / "docs" / "backend-frontend-handoff.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=31, textColor=colors.HexColor("#12324A"), alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontSize=12, leading=18, textColor=colors.HexColor("#476477"), alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="H1Custom", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=colors.HexColor("#12324A"), spaceBefore=13, spaceAfter=8))
styles.add(ParagraphStyle(name="H2Custom", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=colors.HexColor("#197278"), spaceBefore=9, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyCustom", parent=styles["BodyText"], fontSize=9.2, leading=13, textColor=colors.HexColor("#263746"), spaceAfter=5))
styles.add(ParagraphStyle(name="BulletCustom", parent=styles["BodyText"], fontSize=9.2, leading=13, leftIndent=13, firstLineIndent=-8, bulletIndent=3, textColor=colors.HexColor("#263746"), spaceAfter=3))
styles.add(ParagraphStyle(name="CodeCustom", parent=styles["Code"], fontName="Courier", fontSize=7.3, leading=9.5, backColor=colors.HexColor("#F1F5F7"), borderColor=colors.HexColor("#D8E3E8"), borderWidth=0.4, borderPadding=6, leftIndent=4, rightIndent=4, spaceBefore=3, spaceAfter=7))
styles.add(ParagraphStyle(name="SmallCustom", parent=styles["BodyText"], fontSize=8, leading=11, textColor=colors.HexColor("#476477")))


def clean(text):
    return text.encode("ascii", "replace").decode("ascii")


def inline(text):
    text = clean(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier' color='#197278'>\1</font>", text)
    text = text.replace("**", "")
    return escape(text).replace("&lt;font", "<font").replace("&lt;/font&gt;", "</font>").replace("&gt;", ">")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D8E3E8"))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#6B7F8B"))
    canvas.drawString(18 * mm, 9 * mm, "Track the Cash | Backend Frontend Handoff")
    canvas.drawRightString(192 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    story = []
    in_code = False
    code_lines = []
    first_title = True

    for raw in lines:
        line = raw.rstrip()
        if line.startswith("```"):
            if in_code:
                story.append(Preformatted(clean("\n".join(code_lines)), styles["CodeCustom"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line:
            story.append(Spacer(1, 3))
            continue
        if line.startswith("# "):
            title = line[2:]
            if first_title:
                story.append(Spacer(1, 38 * mm))
                story.append(Paragraph(inline(title), styles["CoverTitle"]))
                story.append(Paragraph("Backend API contract for frontend implementation", styles["CoverSub"]))
                story.append(Spacer(1, 7 * mm))
                story.append(Paragraph("Version 1.0 | September 2026", styles["CoverSub"]))
                story.append(PageBreak())
                first_title = False
            else:
                story.append(Paragraph(inline(title), styles["H1Custom"]))
            continue
        if line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), styles["H1Custom"]))
            continue
        if line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), styles["H2Custom"]))
            continue
        if line.startswith("- "):
            story.append(Paragraph("&#8226; " + inline(line[2:]), styles["BulletCustom"]))
            continue
        if re.match(r"^\d+\. ", line):
            story.append(Paragraph(inline(line), styles["BodyCustom"]))
            continue
        if line.startswith("|"):
            story.append(Paragraph(inline(line.replace("|", "  |  ")), styles["SmallCustom"]))
            continue
        if line.startswith("> "):
            story.append(Paragraph(inline(line[2:]), styles["SmallCustom"]))
            continue
        story.append(Paragraph(inline(line), styles["BodyCustom"]))

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=16 * mm, bottomMargin=19 * mm, title="Track the Cash Backend Frontend Handoff", author="Track the Cash")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()
