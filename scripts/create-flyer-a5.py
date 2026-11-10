"""Create the reflowed A5 flyer, render it, and decode its printed QR."""
from pathlib import Path

import qrcode
import pypdfium2 as pdfium
import zxingcpp
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A5
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf"
TMP = ROOT / "tmp/pdfs"
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
PDF = OUT / "rundu-open-2026-flyer-A5.pdf"
URL = "https://runduopen.info"
W, H = A5

for name, filename in [("Arial", "arial.ttf"), ("ArialBold", "arialbd.ttf"), ("CondensedBold", "ARIALNB.TTF")]:
    pdfmetrics.registerFont(TTFont(name, str(Path("C:/Windows/Fonts") / filename)))

GREEN = HexColor("#173F32")
LIME = HexColor("#D4EF43")
INK = HexColor("#203E33")
MUTED = HexColor("#5B6B61")
PALE = HexColor("#F0F2E7")
LINE = HexColor("#D5DCCE")
c = canvas.Canvas(str(PDF), pagesize=A5, pageCompression=1)
c.setTitle("Rundu Open 2026 - A5 tournament flyer")
c.setAuthor("Rundu Open")
c.setSubject("Saturday tennis tournament - registration at runduopen.info")

def box(x, top, width, height, fill, radius=0):
    assert x >= 24 and x + width <= W - 24 + .01
    assert top >= 24 and top + height <= H - 24
    c.setFillColor(fill)
    if radius:
        c.roundRect(x, H-top-height, width, height, radius, stroke=0, fill=1)
    else:
        c.rect(x, H-top-height, width, height, stroke=0, fill=1)

def text(x, baseline, value, size=9, font="Arial", color=INK, max_right=None):
    width = pdfmetrics.stringWidth(value, font, size)
    assert x >= 24 and x + width <= (max_right or W-24), f"Text too wide: {value}"
    assert baseline <= H - 18
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, H-baseline, value)

# A compact header and a larger image retain a strong hierarchy at A5 size.
box(24, 24, W-48, 58, GREEN, 4)
text(36, 56, "RUNDU OPEN", 30, "CondensedBold", white)
text(37, 72, "RECREATIONAL TENNIS / RUNDU, NAMIBIA", 7.5, "ArialBold", LIME)
box(324, 38, 60, 28, LIME, 3)
text(333, 59, "2026", 20, "CondensedBold", GREEN)

photo_x, photo_top, photo_size = 159, 96, W-24-159
c.drawImage(str(ROOT / "public/images/tennis-rainy-season-v2.png"),
            photo_x, H-photo_top-photo_size, photo_size, photo_size,
            preserveAspectRatio=True, mask="auto")

text(27, 111, "SATURDAY ONLY", 8, "ArialBold", GREEN, max_right=152)
text(26, 139, "21 NOVEMBER", 21, "CondensedBold", max_right=152)
text(27, 159, "2026", 16, "CondensedBold", max_right=152)
c.setStrokeColor(LINE)
c.setLineWidth(.6)
c.line(27, H-174, 147, H-174)
text(27, 197, "Kavango River", 13, "CondensedBold", max_right=152)
text(27, 213, "Lodge", 13, "CondensedBold", max_right=152)
text(27, 231, "Rundu, Namibia", 9, color=MUTED, max_right=152)
text(25, 276, "N$20", 34, "CondensedBold", max_right=152)
text(27, 292, "ENTRY PER PLAYER", 7.5, "ArialBold", max_right=152)
text(27, 309, "Payment on site.", 9, color=MUTED, max_right=152)

box(24, 347, W-48, 50, PALE, 4)
text(34, 369, "ONLY 8 PLACES. EVERYONE WELCOME.", 16, "CondensedBold")
text(34, 386, "One open category. All ages and genders. First come, first served.", 8)

text(27, 417, "Match schedule announced Friday morning, 20 November.", 8.5)

box(24, 433, W-48, 118, GREEN, 4)
text(36, 455, "SCAN TO REGISTER", 9, "ArialBold", LIME)
text(35, 481, "runduopen.info", 23, "CondensedBold", white)
text(36, 506, "Registration Deadline: Thursday, 19.Nov.", 8.5, "ArialBold", white, max_right=291)
text(36, 527, "Closes earlier if all 8 places are filled.", 8.5, color=white, max_right=291)

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()
qr_x, qr_top, qr_size = 302, 449, 78
box(qr_x, qr_top, qr_size, qr_size, white)
module = qr_size / len(matrix)
path = c.beginPath()
for row, cells in enumerate(matrix):
    for col, dark in enumerate(cells):
        if dark:
            path.rect(qr_x+col*module, H-qr_top-(row+1)*module, module, module)
c.setFillColor(HexColor("#000000"))
c.drawPath(path, fill=1, stroke=0)
c.linkURL(URL, (qr_x, H-qr_top-qr_size, qr_x+qr_size, H-qr_top), relative=0)
c.linkURL(URL, (35, H-485, 208, H-460), relative=0)
text(27, 575, "Questions? Call Elia: 081 275 25 17", 9.5, "ArialBold")
c.showPage()
c.save()

reader = PdfReader(str(PDF))
assert len(reader.pages) == 1
page = reader.pages[0]
assert abs(float(page.mediabox.width)-W) < .1
assert abs(float(page.mediabox.height)-H) < .1
content = page.extract_text()
for required in ["RUNDU OPEN", "2026", "21 NOVEMBER", "Kavango River", "Lodge", "N$20", "8 PLACES",
                 "All ages and genders", "Registration Deadline: Thursday, 19.Nov.", "runduopen.info",
                 "081 275 25 17", "Payment on site", "Closes earlier if all 8 places are filled."]:
    assert required in content, f"Missing content: {required}"
assert "Sunday" not in content and "No prize money" not in content
assert "Free drinks for all players" not in content
assert [a.get_object().get("/A", {}).get("/URI") for a in page["/Annots"]] == [URL, URL]

rendered = pdfium.PdfDocument(str(PDF))
preview = rendered[0].render(scale=3).to_pil()
preview.save(TMP / "rundu-open-flyer-A5-preview.png")
for scale in [1.5, 3]:
    image = rendered[0].render(scale=scale).to_pil()
    results = zxingcpp.read_barcodes(image)
    assert len(results) == 1 and results[0].text == URL, "Rendered QR must scan"
print(f"Created A5 PDF: {PDF}")
print("Verified page size, content, margins, links, and rendered QR at two resolutions.")
