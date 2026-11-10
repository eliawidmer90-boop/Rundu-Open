"""Build the A4 Rundu Open flyer and verify the printed QR code."""
from pathlib import Path

import qrcode
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
TMP = ROOT / "tmp" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
PDF = OUT / "rundu-open-2026-flyer-A4.pdf"
URL = "https://runduopen.info"

fonts = Path("C:/Windows/Fonts")
for name, file in [("Arial", "arial.ttf"), ("ArialBold", "arialbd.ttf"), ("CondensedBold", "ARIALNB.TTF")]:
    pdfmetrics.registerFont(TTFont(name, str(fonts / file)))

W, H = A4
GREEN = HexColor("#173F32")
LIME = HexColor("#D4EF43")
INK = HexColor("#203E33")
MUTED = HexColor("#5B6B61")
PALE = HexColor("#F0F2E7")
LINE = HexColor("#D5DCCE")

c = canvas.Canvas(str(PDF), pagesize=A4, pageCompression=1)
c.setTitle("Rundu Open 2026 - A4 tournament flyer")
c.setAuthor("Rundu Open")
c.setSubject("Saturday tennis tournament, registration at runduopen.info")
c.setKeywords("Rundu Open, tennis, 21 November 2026, registration")

def box(x, top, width, height, fill, radius=0):
    c.setFillColor(fill)
    c.setStrokeColor(fill)
    if radius:
        c.roundRect(x, H-top-height, width, height, radius, stroke=0, fill=1)
    else:
        c.rect(x, H-top-height, width, height, stroke=0, fill=1)

def text(x, baseline, value, size=11, font="Arial", color=INK):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, H-baseline, value)

def line(x1, x2, top):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(x1, H-top, x2, H-top)

# All content lies inside a 12 mm printer-safe margin.
box(34, 34, W-68, 77, GREEN, 5)
text(50, 77, "RUNDU OPEN", 37, "CondensedBold", white)
text(51, 97, "RECREATIONAL TENNIS  /  RUNDU, NAMIBIA", 9.2, "ArialBold", LIME)
box(464, 52, 80, 36, LIME, 3)
text(476, 78, "2026", 25, "CondensedBold", GREEN)

photo_x, photo_top, photo_size = 274, 128, 287
c.drawImage(str(ROOT / "public/images/tennis-rainy-season-v2.png"),
            photo_x, H-photo_top-photo_size, photo_size, photo_size,
            preserveAspectRatio=True, mask="auto")

text(40, 146, "SATURDAY ONLY", 10, "ArialBold", GREEN)
text(38, 184, "21 NOVEMBER", 30, "CondensedBold")
text(40, 213, "2026", 24, "CondensedBold")
line(40, 248, 230)
text(40, 257, "Kavango River Lodge", 15, "CondensedBold")
text(40, 277, "Rundu, Namibia", 11, color=MUTED)
text(38, 337, "N$20", 46, "CondensedBold")
text(40, 359, "ENTRY PER PLAYER", 9.5, "ArialBold", GREEN)
text(40, 378, "Payment on site.", 10.5, color=MUTED)

box(34, 435, W-68, 54, PALE, 4)
text(48, 458, "ONLY 8 PLACES. EVERYONE WELCOME.", 19, "CondensedBold")
text(48, 477, "One open category. All ages and genders. First come, first served.", 10)

text(40, 537, "Match schedule announced Friday morning, 20 November.", 10.5)

box(34, 585, W-68, 166, GREEN, 5)
text(51, 616, "SCAN TO REGISTER", 11, "ArialBold", LIME)
text(49, 651, "runduopen.info", 26, "CondensedBold", white)
text(51, 686, "Registration Deadline: Thursday, 19.Nov.", 10.5, "ArialBold", white)
text(51, 715, "Closes earlier if all 8 places are filled.", 9.5, color=white)

# True vector QR with a four-module white quiet zone. No image-generation QR.
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()
qr_x, qr_top, qr_size = 424, 606, 120
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
c.linkURL(URL, (49, H-658, 245, H-627), relative=0)

text(40, 785, "Questions? Call Elia: 081 275 25 17", 11, "ArialBold")
c.showPage()
c.save()

reader = PdfReader(str(PDF))
assert len(reader.pages) == 1
extracted = reader.pages[0].extract_text()
for required in ["RUNDU OPEN", "2026", "21 NOVEMBER", "Kavango River Lodge", "N$20", "8 PLACES",
                 "All ages and genders", "Registration Deadline: Thursday, 19.Nov.", "runduopen.info", "081 275 25 17",
                 "Payment on site"]:
    assert required in extracted, f"Missing flyer content: {required}"
assert "Sunday" not in extracted
assert abs(float(reader.pages[0].mediabox.width)-W) < 0.1
links = [a.get_object().get("/A", {}).get("/URI") for a in reader.pages[0]["/Annots"]]
assert links == [URL, URL]
print(f"Created and checked A4 PDF: {PDF}")
