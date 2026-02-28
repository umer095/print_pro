import os
import pandas as pd
import uuid
from PIL import Image, ImageDraw, ImageFont, ImageColor, ImageEnhance
from pathlib import Path

# ====================================================
# PATH CONFIGURATION
# ====================================================
CURRENT_FILE = Path(__file__).resolve()
BASE_DIR = CURRENT_FILE.parent.parent.parent
STATIC_DIR = BASE_DIR / "static"
FONT_DIR = STATIC_DIR / "fonts"
TEMPLATE_DIR = STATIC_DIR / "templates"
OUTPUT_DIR = STATIC_DIR / "outputs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Convert for os.path
FONT_DIR_STR = str(FONT_DIR)
TEMPLATE_DIR_STR = str(TEMPLATE_DIR)
OUTPUT_DIR_STR = str(OUTPUT_DIR)

# ====================================================
# FONT MAPPING: Frontend Name -> Local File
# ====================================================
# Maps frontend font names (from AVAILABLE_FONTS in printingService.ts)
# to actual .ttf files in the fonts directory
#
# IMPORTANT: This mapping is CRITICAL for PDF font rendering!
# If a font is selected in frontend but NOT mapped here,
# it will fall back to the default PIL font (very basic).
# ====================================================

FONT_MAPPING = {
    # =============================================
    # GOOGLE FONTS (most commonly used)
    # =============================================
    'Roboto': 'Roboto-400.ttf',
    'Open Sans': 'OpenSans-400.ttf',
    'OpenSans': 'OpenSans-400.ttf',
    'Lato': 'Lato-400.ttf',
    'Montserrat': 'Montserrat-400.ttf',
    'Oswald': 'Oswald-400.ttf',
    'Poppins': 'Poppins-400.ttf',
    'Ubuntu': 'Ubuntu-400.ttf',
    'Inter': 'Inter-400.ttf',
    
    # =============================================
    # SPORTS/TECH FONTS
    # =============================================
    'Bebas Neue': 'BebasNeue.ttf',
    'Anton': 'Anton.ttf',
    'Russo One': 'RussoOne.ttf',
    'Teko': 'Teko-400.ttf',
    'Exo 2': 'Exo2-400.ttf',
    'Exo2': 'Exo2-400.ttf',
    'Quantico': 'Quantico-400.ttf',
    'Chakra Petch': 'ChakraPetch-400.ttf',
    'ChakraPetch': 'ChakraPetch-400.ttf',
    'Barlow Condensed': 'BarlowCondensed-400.ttf',
    'BarlowCondensed': 'BarlowCondensed-400.ttf',
    
    # =============================================
    # DECORATIVE/STYLISH FONTS
    # =============================================
    'Fjalla One': 'FjallaOne.ttf',
    'FjallaOne': 'FjallaOne.ttf',
    'Righteous': 'Righteous.ttf',
    'Permanent Marker': 'PermanentMarker.ttf',
    'Luckiest Guy': 'LuckiestGuy.ttf',
    'Monoton': 'Monoton.ttf',
    'Michroma': 'Michroma.ttf',
    'Black Ops One': 'BlackOpsOne.ttf',
    'BlackOpsOne': 'BlackOpsOne.ttf',
    
    # =============================================
    # ALTERNATIVES (for fonts without .ttf files)
    # =============================================
    'Raleway': 'Montserrat-400.ttf',  # Raleway not available, fallback to Montserrat
    'Raleway-400.ttf': 'Montserrat-400.ttf',
    'Bungee': 'BebasNeue.ttf',  # Bungee not available, fallback to BebasNeue
    'Abril Fatface': 'Montserrat-400.ttf',  # Abril Fatface not available
    'Orbitron': 'Orbitron-400.ttf',  # Use the -400 version
    'Orbitron.ttf': 'Orbitron-400.ttf',
    
    # =============================================
    # LOCAL FONT FILES (explicit .ttf references)
    # =============================================
    'BebasNeue.ttf': 'BebasNeue.ttf',
    'Anton.ttf': 'Anton.ttf',
    'RussoOne.ttf': 'RussoOne.ttf',
    'Orbitron.ttf': 'Orbitron-400.ttf',
    'Roboto-400.ttf': 'Roboto-400.ttf',
    'OpenSans-400.ttf': 'OpenSans-400.ttf',
    'Lato-400.ttf': 'Lato-400.ttf',
    'Montserrat-400.ttf': 'Montserrat-400.ttf',
    'Oswald-400.ttf': 'Oswald-400.ttf',
    'Poppins-400.ttf': 'Poppins-400.ttf',
    'Ubuntu-400.ttf': 'Ubuntu-400.ttf',
    'Inter-400.ttf': 'Inter-400.ttf',
    'Teko-400.ttf': 'Teko-400.ttf',
    'Exo2-400.ttf': 'Exo2-400.ttf',
    'Quantico-400.ttf': 'Quantico-400.ttf',
    'ChakraPetch-400.ttf': 'ChakraPetch-400.ttf',
    'FjallaOne.ttf': 'FjallaOne.ttf',
    'Righteous.ttf': 'Righteous.ttf',
    'PermanentMarker.ttf': 'PermanentMarker.ttf',
    'LuckiestGuy.ttf': 'LuckiestGuy.ttf',
    'Monoton.ttf': 'Monoton.ttf',
    'Michroma.ttf': 'Michroma.ttf',
    'BlackOpsOne.ttf': 'BlackOpsOne.ttf',
    'BarlowCondensed-400.ttf': 'BarlowCondensed-400.ttf',
}

# ====================================================
# FONT LOADING WITH DEBUG & FALLBACK
# ====================================================

def normalize_color(color):
    try:
        return ImageColor.getrgb(color)
    except Exception:
        return (255, 255, 255)


def list_available_fonts():
    """List all available .ttf files in the fonts directory."""
    if not os.path.exists(FONT_DIR_STR):
        return []
    fonts = []
    for f in os.listdir(FONT_DIR_STR):
        if f.lower().endswith('.ttf') and not f.lower().endswith('.ttc'):
            fonts.append(f)
    return sorted(fonts)


def test_font_loading(font_file, size=48):
    """
    Test font loading and return diagnostic information.
    Returns dict with font_name, font_path, success, and error_message.
    """
    result = {
        'requested_font': font_file,
        'font_name': None,
        'font_path': None,
        'success': False,
        'error': None,
        'is_default': False
    }
    
    # Normalize font filename - remove .ttf extension if present
    font_base = font_file.replace('.ttf', '').replace('.TTF', '')
    
    # Try to find mapped font
    mapped_font = FONT_MAPPING.get(font_file) or FONT_MAPPING.get(font_base)
    
    if mapped_font:
        font_path = os.path.join(FONT_DIR_STR, mapped_font)
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, size)
                result['success'] = True
                result['font_name'] = mapped_font
                result['font_path'] = font_path
                return result
            except Exception as e:
                result['error'] = f"Could not load mapped font: {e}"
    
    # Try the original font_file name directly
    if font_file.endswith(('.ttf', '.TTF')):
        font_path = os.path.join(FONT_DIR_STR, font_file)
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, size)
                result['success'] = True
                result['font_name'] = font_file
                result['font_path'] = font_path
                return result
            except Exception as e:
                result['error'] = f"Could not load font directly: {e}"
    
    # Try with .ttf extension appended
    font_with_ext = f"{font_base}.ttf"
    font_path = os.path.join(FONT_DIR_STR, font_with_ext)
    if os.path.exists(font_path):
        try:
            font = ImageFont.truetype(font_path, size)
            result['success'] = True
            result['font_name'] = font_with_ext
            result['font_path'] = font_path
            return result
        except Exception as e:
            result['error'] = f"Could not load font with extension: {e}"
    
    # Fallback chain - try common fonts in order of preference
    fallback_fonts = [
        'BebasNeue.ttf',
        'Roboto-400.ttf',
        'Montserrat-400.ttf',
        'Anton.ttf',
        'Oswald-400.ttf',
        'Poppins-400.ttf',
        'OpenSans-400.ttf',
    ]
    
    for fallback in fallback_fonts:
        fp = os.path.join(FONT_DIR_STR, fallback)
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, size)
                result['success'] = True
                result['font_name'] = fallback
                result['font_path'] = fp
                result['error'] = f"Used fallback font (original '{font_file}' not found)"
                return result
            except:
                continue
    
    # Last resort: PIL default font
    font = ImageFont.load_default()
    result['success'] = True
    result['font_name'] = 'PIL Default'
    result['is_default'] = True
    result['error'] = f"All fonts failed, using PIL default font"
    return result


def load_font(font_file, size):
    """
    Load font with proper mapping from frontend names to local files.
    Includes multiple fallback options for reliability.
    
    DEBUG: This function now logs detailed information about font loading.
    """
    # Normalize font filename - remove .ttf extension if present
    font_base = font_file.replace('.ttf', '').replace('.TTF', '')
    
    # First, try to map the font name to a local file
    mapped_font = FONT_MAPPING.get(font_file) or FONT_MAPPING.get(font_base)
    
    if mapped_font:
        font_path = os.path.join(FONT_DIR_STR, mapped_font)
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, size)
                print(f"FONT DEBUG: ✓ Loaded '{font_file}' -> '{mapped_font}' (size: {size})")
                return font
            except Exception as e:
                print(f"FONT DEBUG: ✗ Could not load mapped font '{mapped_font}': {e}")
    
    # Try the original font_file name directly
    if font_file.endswith(('.ttf', '.TTF')):
        font_path = os.path.join(FONT_DIR_STR, font_file)
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, size)
                print(f"FONT DEBUG: ✓ Loaded '{font_file}' directly (size: {size})")
                return font
            except Exception as e:
                print(f"FONT DEBUG: ✗ Could not load font '{font_file}': {e}")
    
    # Try with .ttf extension appended
    font_with_ext = f"{font_base}.ttf"
    font_path = os.path.join(FONT_DIR_STR, font_with_ext)
    if os.path.exists(font_path):
        try:
            font = ImageFont.truetype(font_path, size)
            print(f"FONT DEBUG: ✓ Loaded '{font_base}' -> '{font_with_ext}' (size: {size})")
            return font
        except Exception as e:
            print(f"FONT DEBUG: ✗ Could not load font '{font_with_ext}': {e}")
    
    # Fallback chain - try common fonts in order of preference
    fallback_fonts = [
        'BebasNeue.ttf',
        'Roboto-400.ttf',
        'Montserrat-400.ttf',
        'Anton.ttf',
        'Oswald-400.ttf',
        'Poppins-400.ttf',
        'OpenSans-400.ttf',
    ]
    
    for fallback in fallback_fonts:
        fp = os.path.join(FONT_DIR_STR, fallback)
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, size)
                print(f"FONT DEBUG: ⚠ Used fallback '{fallback}' for requested '{font_file}' (size: {size})")
                return font
            except:
                continue
    
    # Last resort: PIL default font
    print(f"FONT DEBUG: ✗ CRITICAL: All fonts failed for '{font_file}', using PIL default font (size: {size})")
    return ImageFont.load_default()


def draw_centered(draw, text, font, cx, cy, text_color, outline_color, spacing=0):
    """
    Draw centered text with optional character spacing and outline.
    """
    if not text:
        return
        
    if spacing == 0:
        try:
            # For newer PIL versions
            bbox = font.getbbox(text)
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
        except AttributeError:
            # Fallback for older PIL versions
            try:
                w, h = draw.textsize(text, font=font)
            except:
                w, h = len(text) * font.size * 0.6, font.size
        
        x = int(cx - w / 2)
        y = int(cy - h / 2)
        
        # Draw outline
        outline_width = 2
        for dx in range(-outline_width, outline_width + 1):
            for dy in range(-outline_width, outline_width + 1):
                if dx or dy:
                    draw.text((x + dx, y + dy), text, fill=outline_color, font=font)
        
        # Draw fill
        draw.text((x, y), text, fill=text_color, font=font)
        return

    # Complex spacing logic for character-by-character drawing
    char_widths = []
    max_h = 0
    
    for ch in text:
        try:
            bbox = font.getbbox(ch)
            char_widths.append(bbox[2] - bbox[0])
            max_h = max(max_h, bbox[3] - bbox[1])
        except AttributeError:
            char_widths.append(font.size * 0.6)
            max_h = font.size
    
    total_w = sum(char_widths) + spacing * (len(text) - 1)
    x = int(cx - total_w / 2)
    y = int(cy - max_h / 2)
    
    cur_x = x
    outline_width = 2
    
    for i, ch in enumerate(text):
        # Draw outline for each character
        for dx in range(-outline_width, outline_width + 1):
            for dy in range(-outline_width, outline_width + 1):
                if dx or dy:
                    draw.text((cur_x+dx, y+dy), ch, fill=outline_color, font=font)
        # Draw fill
        draw.text((cur_x, y), ch, fill=text_color, font=font)
        cur_x += char_widths[i] + spacing


def get_template_path(template_id, custom_path=None):
    """Get the path to a template image file."""
    if custom_path and os.path.exists(custom_path):
        return custom_path
    
    if template_id in TEMPLATES:
        p = os.path.join(TEMPLATE_DIR_STR, TEMPLATES[template_id])
        if os.path.exists(p):
            return p
    
    # Fallback to default template
    default_path = os.path.join(TEMPLATE_DIR_STR, TEMPLATES.get("default", "default.png"))
    if os.path.exists(default_path):
        return default_path
    
    return None


def render_logo_on_jersey(img, logo_data):
    """
    Render a single logo on the jersey image.
    
    Args:
        img: PIL Image to draw on
        logo_data: Dict containing:
            - enabled: Whether to render logo
            - logoUrl: URL or data URL of the logo image
            - position: 'left_chest' | 'right_chest' | 'center' | 'top' | 'bottom' | 'custom'
            - x_ratio: X position as ratio (0-1) for custom position
            - y_ratio: Y position as ratio (0-1) for custom position
            - width_ratio: Logo width as ratio of template width (default ~0.15)
            - opacity: Logo opacity (0-1)
            - rotation: Logo rotation in degrees
    
    Returns:
        The image with logo drawn
    """
    if not logo_data or not logo_data.get('enabled', False):
        return img
    
    try:
        # Get logo URL (support both 'url' and 'logoUrl' field names)
        logo_url = logo_data.get('url') or logo_data.get('logoUrl')
        if not logo_url:
            print("LOGO DEBUG: ✗ No logo URL found in logo_data")
            return img
        
        # Parse base64 data URL
        if not logo_url.startswith('data:image'):
            print(f"LOGO DEBUG: ✗ Logo URL doesn't start with 'data:image': {logo_url[:50]}...")
            return img
        
        # Get position configuration
        position = logo_data.get('position', 'custom')
        
        # Calculate position based on preset
        W, H = img.size
        
        # Default position ratios (center of chest area)
        x_ratio = 0.5
        y_ratio = 0.25  # Chest area
        
        if position == 'left_chest':
            x_ratio = 0.25
            y_ratio = 0.30
        elif position == 'right_chest':
            x_ratio = 0.75
            y_ratio = 0.30
        elif position == 'center':
            x_ratio = 0.5
            y_ratio = 0.5
        elif position == 'top':
            x_ratio = 0.5
            y_ratio = 0.15
        elif position == 'bottom':
            x_ratio = 0.5
            y_ratio = 0.85
        elif position == 'custom':
            x_ratio = logo_data.get('x_ratio', 0.5)
            y_ratio = logo_data.get('y_ratio', 0.25)
        
        # Get width ratio (default ~15% of template width)
        width_ratio = logo_data.get('width_ratio', 0.15)
        logo_size = int(W * width_ratio)
        
        # Get opacity
        opacity = logo_data.get('opacity', 1.0)
        
        # Get rotation
        rotation = logo_data.get('rotation', 0)
        
        # Extract base64 data
        base64_data = logo_url.split(',')[1] if ',' in logo_url else logo_url
        import base64
        logo_bytes = base64.b64decode(base64_data)
        
        # Open logo image
        from io import BytesIO
        logo_img = Image.open(BytesIO(logo_bytes)).convert("RGBA")
        
        # Resize logo maintaining aspect ratio
        orig_w, orig_h = logo_img.size
        aspect_ratio = orig_w / orig_h if orig_h > 0 else 1
        new_w = int(logo_size)
        new_h = int(logo_size / aspect_ratio) if aspect_ratio > 0 else int(logo_size)
        
        logo_img = logo_img.resize((new_w, new_h), Image.LANCZOS)
        
        # Apply opacity
        if opacity < 1.0:
            alpha = logo_img.split()[3]
            alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
            logo_img.putalpha(alpha)
        
        # Apply rotation if needed
        if rotation != 0:
            logo_img = logo_img.rotate(-rotation, Image.LANCZOS, expand=True)
            # Recalculate size after rotation
            new_w, new_h = logo_img.size
        
        # Calculate position
        x = int(W * x_ratio) - new_w // 2
        y = int(H * y_ratio) - new_h // 2
        
        # Paste logo with transparency
        img.paste(logo_img, (x, y), logo_img)
        
        print(f"LOGO DEBUG: ✓ Logo rendered at position '{position}' ({x_ratio}, {y_ratio}) with size {new_w}x{new_h}, opacity {opacity}, rotation {rotation}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"LOGO DEBUG: ✗ Error rendering logo: {e}")
    
    return img


def render_logos_on_jersey(img, logos_data):
    """
    Render multiple logos on the jersey image.
    
    Args:
        img: PIL Image to draw on
        logos_data: Either:
            - A list of logo dictionaries (new format from frontend)
            - A single logo dictionary (legacy format)
    
    Returns:
        The image with all logos drawn
    """
    if not logos_data:
        print("LOGO DEBUG: No logos_data provided")
        return img
    
    # Handle list of logos (new format)
    if isinstance(logos_data, list):
        print(f"LOGO DEBUG: Processing {len(logos_data)} logo(s)")
        for i, logo_data in enumerate(logos_data):
            print(f"LOGO DEBUG: Rendering logo {i+1}/{len(logos_data)}: enabled={logo_data.get('enabled', False) if isinstance(logo_data, dict) else 'N/A'}")
            img = render_logo_on_jersey(img, logo_data)
        return img
    
    # Handle single logo dict (legacy format)
    if isinstance(logos_data, dict):
        print("LOGO DEBUG: Processing single logo (legacy format)")
        return render_logo_on_jersey(img, logos_data)
    
    print(f"LOGO DEBUG: Unexpected logos_data type: {type(logos_data)}")
    return img


def render_jersey(template_id, name, number, nxr, nyr, numxr, numyr, nfs, numfs, ff, tc, oc, cust, spacing, nc, tw, th, logo_data=None):
    """Render a single jersey with name, number, and optionally a logo."""
    path = get_template_path(template_id, cust)
    
    if not path:
        # Create red fallback if template missing
        img = Image.new("RGBA", (int(tw or 300), int(th or 400)), "red")
    else:
        try:
            img = Image.open(path).convert("RGBA")
        except Exception as e:
            print(f"Warning: Could not open template {template_id}: {e}")
            img = Image.new("RGBA", (300, 400), "red")

    if tw and th: 
        try:
            img = img.resize((int(tw), int(th)), Image.LANCZOS)
        except Exception as e:
            print(f"Warning: Could not resize template: {e}")

    W, H = img.size
    draw = ImageDraw.Draw(img)
    
    # Load fonts using the improved load_font function
    nf = load_font(ff, int(nfs))
    numf = load_font(ff, int(numfs))
    
    # Determine colors
    text_rgb = normalize_color(tc)
    outline_rgb = normalize_color(oc)
    number_rgb = normalize_color(nc) if nc else text_rgb
    
    # Draw name and number
    draw_centered(draw, name, nf, int(W*nxr), int(H*nyr), text_rgb, outline_rgb, spacing)
    draw_centered(draw, number, numf, int(W*numxr), int(H*numyr), number_rgb, outline_rgb, 0)
    
    # Draw logo(s) if provided - supports both single logo dict and list of logos
    if logo_data:
        img = render_logos_on_jersey(img, logo_data)
    
    return img


# ====================================================
# MAIN LOGIC
# ====================================================
def generate_pdf(
    excel_path, template_id,
    name_x_ratio, name_y_ratio,
    number_x_ratio, number_y_ratio,
    name_font_size, number_font_size,
    font_file, text_color, number_color=None, spacing=0, outline_color=None,
    mode="combined",
    manual_name=None, manual_number=None, manual_size=None,
    custom_template_path=None, render_scale=2,
    template_width=None, template_height=None,
    selected_player=None,
    logo_data=None
):
    print(f"DEBUG: Processing with template={template_id}, font={font_file}")
    
    # 1. READ DATAFRAME (Handles CSV vs Excel or individual mode)
    if excel_path is None:
        # Individual mode: create DataFrame from manual data
        df = pd.DataFrame([{
            'Name': manual_name or '',
            'Number': manual_number or '',
            'Size': manual_size or 'L'
        }])
    elif isinstance(excel_path, str):
        if excel_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(excel_path)
        else:
            # Default to CSV
            df = pd.read_csv(excel_path)
    else:
        df = excel_path

    # Normalize Columns
    cols = {c.lower().strip(): c for c in df.columns}
    rename_map = {}
    if 'name' in cols: rename_map[cols['name']] = 'Name'
    if 'number' in cols: rename_map[cols['number']] = 'Number'
    if 'size' in cols: rename_map[cols['size']] = 'Size'
    df.rename(columns=rename_map, inplace=True)
    
    if "Size" not in df.columns: df["Size"] = "DEFAULT"

    # Process Pages
    pages = []
    text_rgb = normalize_color(text_color)
    outline_rgb = normalize_color(outline_color)
    scale = float(render_scale)

    grouped = df.groupby("Size")
    
    for size, group in grouped:
        # Get dimensions (using L as fallback for map)
        dims = JERSEY_DIMENSIONS.get(size, JERSEY_DIMENSIONS['L'])
        p_dim = PAGE_DIMENSIONS.get(size, PAGE_DIMENSIONS['L'])
        items_row = ITEMS_PER_ROW_MAP.get('DEFAULT', 5)
        
        jw = int(dims['width'] * scale)
        jh = int(dims['height'] * scale)
        pw = int(p_dim['width'] * scale)
        
        # Create Page
        rows = (len(group) + items_row - 1) // items_row
        ph = 200 + rows * (jh + 50) # Approx height
        page = Image.new("RGB", (pw, ph), "white")
        draw = ImageDraw.Draw(page)
        
        # Header with loaded font
        hfont = load_font(font_file, int(48 * scale))
        draw.text((50, 50), f"SIZE : {size}", fill="black", font=hfont)
        
        x0, y0 = 50, 150
        
        for idx, (_, row) in enumerate(group.iterrows()):
            jersey = render_jersey(
                template_id, str(row.get("Name", "")), str(row.get("Number", "")),
                name_x_ratio, name_y_ratio, number_x_ratio, number_y_ratio,
                name_font_size * scale, number_font_size * scale, font_file,
                text_rgb, outline_rgb, custom_template_path,
                spacing * scale, normalize_color(number_color) if number_color else None, jw, jh,
                logo_data
            )
            
            col = idx % items_row
            r = idx // items_row
            x = x0 + col * (jw + 30)
            y = y0 + r * (jh + 30)
            page.paste(jersey, (x, y), jersey if jersey.mode == 'RGBA' else None)
            
        pages.append(page)

    unique_filename = f"Job_{uuid.uuid4().hex[:8]}.pdf"
    output_path = OUTPUT_DIR / unique_filename
    
    if not pages:
        raise ValueError("No pages generated. Check that player data is valid and templates exist.")
    
    # Save the file
    pages[0].save(output_path, save_all=True, append_images=pages[1:])
    
    print(f"DEBUG: PDF generated successfully: {output_path}")
    return str(output_path)


# ====================================================
# CONSTANTS & DEFAULTS
# ====================================================
JERSEY_DIMENSIONS = {
    'XS': {'width': 250, 'height': 320, 'font_multiplier': 0.6},
    'S':  {'width': 300, 'height': 380, 'font_multiplier': 0.75},
    'M':  {'width': 350, 'height': 450, 'font_multiplier': 0.9},
    'L':  {'width': 400, 'height': 520, 'font_multiplier': 1.0},
    'XL': {'width': 450, 'height': 580, 'font_multiplier': 1.1},
    'XXL': {'width': 500, 'height': 650, 'font_multiplier': 1.25},
    '3XL': {'width': 550, 'height': 720, 'font_multiplier': 1.4},
    '4XL': {'width': 600, 'height': 790, 'font_multiplier': 1.55}
}

PAGE_DIMENSIONS = {
    'XS': {'width': 1190, 'height': 1680},
    'S':  {'width': 1420, 'height': 2000},
    'M':  {'width': 1650, 'height': 2300},
    'L':  {'width': 1880, 'height': 2600},
    'XL': {'width': 2100, 'height': 2900},
    'XXL': {'width': 2330, 'height': 3200},
    '3XL': {'width': 2560, 'height': 3500},
    '4XL': {'width': 2790, 'height': 3800},
    'DEFAULT': {'width': 2480, 'height': 3508}
}

PAGE_MARGINS = {'DEFAULT': 100}
HEADER_HEIGHTS = {'DEFAULT': 120}
H_GAPS = {'DEFAULT': 30}
V_GAPS = {'DEFAULT': 30}
ITEMS_PER_ROW_MAP = {'DEFAULT': 5}

TEMPLATES = {
    "default": "default.png",
    "blue_splash": "blue_splash.png",
    "red_triangle": "red_triangle.png"
}

