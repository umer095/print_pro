from PIL import Image

def autocrop(img: Image.Image) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img

def resize_to_height(img: Image.Image, h_px: int) -> Image.Image:
    w, h = img.size
    scale = h_px / h
    return img.resize((int(w * scale), h_px), Image.LANCZOS)
