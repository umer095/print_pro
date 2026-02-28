
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from PIL import Image, ImageDraw, ImageFont

from app.logic.utils import autocrop
from app.logic.maxrects import MaxRectsBin

# --------------------------------------------------
# ROUTER
# --------------------------------------------------
router = APIRouter(prefix="", tags=["Logo Packing"])

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

# --------------------------------------------------
# HELPERS
# --------------------------------------------------
def parse_floats(v: str):
    return [float(x.strip()) if x.strip().lower() != "none" else None for x in v.split(",")]

def parse_ints(v: str):
    return [int(x.strip()) for x in v.split(",")]

def resize_logo(img: Image.Image, w_px: int, h_px: Optional[int] = None):
    ow, oh = img.size
    if h_px:
        return img.resize((w_px, h_px), Image.LANCZOS)
    scale = w_px / ow
    return img.resize((w_px, int(oh * scale)), Image.LANCZOS)

def draw_metadata(canvas: Image.Image, used_height_px: int, margin_px: int, dpi: int):
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except:
        font = ImageFont.load_default()

    text = f"{datetime.now():%d-%m-%Y %H:%M} | Printed Height: {round(used_height_px / dpi, 2)} in"
    bbox = draw.textbbox((0, 0), text, font=font)

    draw.rectangle(
        (0, 0, canvas.width, bbox[3] + margin_px),
        fill=(245, 245, 245)
    )
    draw.text(
        ((canvas.width - bbox[2]) // 2, margin_px // 2),
        text,
        fill=(0, 0, 0),
        font=font
    )

# --------------------------------------------------
# DOWNLOAD
# --------------------------------------------------
@router.get("/download/{filename}")
def download(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(path, filename=filename)

# --------------------------------------------------
# ARRANGE (GLOBAL + TRIANGLE ROTATION)
# --------------------------------------------------
@router.post("/arrange")
async def arrange(
    files: List[UploadFile] = File(...),
    widths_in: str = Form(...),
    quantities: str = Form(...),
    heights_in: Optional[str] = Form(None),
    sheet_width_in: float = Form(22.5),
    sheet_height_in: float = Form(80),
    spacing_in: float = Form(0),
    margin_cm: float = Form(0),
    dpi: int = Form(300),
):
    widths = parse_floats(widths_in)
    heights = parse_floats(heights_in) if heights_in else [None] * len(files)
    qtys = parse_ints(quantities)

    if not (len(files) == len(widths) == len(heights) == len(qtys)):
        raise HTTPException(400, "Input length mismatch")

    sheet_w_px = int(sheet_width_in * dpi)
    sheet_h_px = int(sheet_height_in * dpi)
    spacing_px = int(spacing_in * dpi)
    margin_px = int((margin_cm / 2.54) * dpi)

    metadata_space = 40
    usable_w = sheet_w_px - 2 * margin_px
    usable_h = sheet_h_px - margin_px - metadata_space

    # --------------------------------------------------
    # LOAD ALL LOGOS → SINGLE TILE LIST
    # --------------------------------------------------
    tiles: List[Image.Image] = []

    for i, file in enumerate(files):
        base = Image.open(file.file).convert("RGBA")
        base = autocrop(base)
        base = resize_logo(
            base,
            int(widths[i] * dpi),
            int(heights[i] * dpi) if heights[i] else None
        )

        for q in range(qtys[i]):
            if q % 2 == 0:
                tiles.append(base.copy())
            else:
                tiles.append(base.rotate(180, expand=True))

    tiles.sort(key=lambda i: i.width * i.height, reverse=True)

    sheets = []
    remaining = tiles[:]
    sheet_no = 1

    # --------------------------------------------------
    # MULTI-SHEET PACKING
    # --------------------------------------------------
    while remaining:
        packer = MaxRectsBin(usable_w, usable_h)
        placements = []
        used_indexes = []
        max_y_used = 0

        for idx, img in enumerate(remaining):
            rect = packer.insert(img)
            if not rect:
                break

            final_img = img.rotate(90, expand=True) if rect.rotated else img

            x = rect.x + margin_px + spacing_px // 2
            y = rect.y + margin_px + metadata_space + spacing_px // 2

            placements.append((final_img, x, y))
            used_indexes.append(idx)
            max_y_used = max(max_y_used, y + final_img.height)

        if not placements:
            break

        for idx in reversed(used_indexes):
            remaining.pop(idx)

        canvas_height = min(max_y_used + margin_px, sheet_h_px)
        canvas = Image.new("RGBA", (sheet_w_px, canvas_height), (255, 255, 255, 255))

        for img, x, y in placements:
            canvas.paste(img, (x, y), img)

        draw_metadata(canvas, canvas_height, margin_px, dpi)

        sheet_id = uuid.uuid4().hex
        png = f"{sheet_id}.png"
        pdf = f"{sheet_id}.pdf"

        canvas.save(OUTPUT_DIR / png, "PNG", dpi=(dpi, dpi))
        canvas.convert("RGB").save(OUTPUT_DIR / pdf, "PDF", resolution=dpi)

        sheets.append({
            "sheet": sheet_no,
            "png": f"/download/{png}",
            "pdf": f"/download/{pdf}",
            "printed_height_in": round(canvas_height / dpi, 2)
        })

        sheet_no += 1

    return {
        "status": "success",
        "total_sheets": len(sheets),
        "unplaced_logos": len(remaining),
        "sheets": sheets
    }
