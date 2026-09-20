"""Render docs/project-file-guide.md as a readable PDF."""

from pathlib import Path
import re

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "project-file-guide.md"
OUTPUT = ROOT / "docs" / "project-file-guide.pdf"


def inline_markup(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def build_story(markdown: str):
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="GuideTitle", parent=styles["Title"], fontName="Helvetica-Bold",
        fontSize=22, leading=27, alignment=TA_CENTER, textColor="#12304A",
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="GuideSubtitle", parent=styles["Normal"], fontName="Helvetica",
        fontSize=9, leading=12, alignment=TA_CENTER, textColor="#52606D",
        spaceAfter=14,
    ))
    styles.add(ParagraphStyle(
        name="GuideH1", parent=styles["Heading1"], fontName="Helvetica-Bold",
        fontSize=16, leading=20, textColor="#12304A", spaceBefore=12, spaceAfter=7,
    ))
    styles.add(ParagraphStyle(
        name="GuideH2", parent=styles["Heading2"], fontName="Helvetica-Bold",
        fontSize=11.5, leading=15, textColor="#0B7285", spaceBefore=9, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="GuideBody", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=9, leading=12.5, textColor="#1F2933", spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name="GuideBullet", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=9, leading=12.5, leftIndent=13, firstLineIndent=-8,
        textColor="#1F2933", spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="GuideCode", parent=styles["Code"], fontName="Courier",
        fontSize=7.5, leading=10, leftIndent=8, rightIndent=8,
        backColor="#F1F5F7", borderColor="#D9E2EC", borderWidth=0.5,
        borderPadding=6, spaceBefore=4, spaceAfter=7,
    ))

    story = []
    in_code = False
    code_lines = []
    first_heading = True

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if line.startswith("```"):
            if in_code:
                story.append(Preformatted("\n".join(code_lines), styles["GuideCode"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line:
            story.append(Spacer(1, 2))
            continue
        if line.startswith("# "):
            story.append(Paragraph(inline_markup(line[2:]), styles["GuideTitle"]))
            first_heading = False
        elif line.startswith("## "):
            story.append(Paragraph(inline_markup(line[3:]), styles["GuideH1"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline_markup(line[4:]), styles["GuideH2"]))
        elif line.startswith("- "):
            story.append(Paragraph("- " + inline_markup(line[2:]), styles["GuideBullet"]))
        elif re.match(r"^\d+\. ", line):
            story.append(Paragraph(inline_markup(line), styles["GuideBullet"]))
        elif line.startswith("> "):
            story.append(Paragraph(inline_markup(line[2:]), styles["GuideSubtitle"]))
        elif line.startswith("---"):
            story.append(HRFlowable(width="100%", thickness=0.6, color="#BCCCDC", spaceBefore=5, spaceAfter=7))
        elif line.startswith("|"):
            story.append(Paragraph(inline_markup(line.replace("|", "  |  ").strip()), styles["GuideBody"]))
        else:
            story.append(Paragraph(inline_markup(line), styles["GuideBody"]))

    return story


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColorRGB(0.35, 0.4, 0.45)
    canvas.drawString(18 * mm, 12 * mm, "Track the Cash - Project File Guide")
    canvas.drawRightString(192 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=18 * mm,
        title="Track the Cash: Project File and Folder Guide",
        author="Track the Cash project",
    )
    document.build(build_story(SOURCE.read_text(encoding="utf-8")), onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
