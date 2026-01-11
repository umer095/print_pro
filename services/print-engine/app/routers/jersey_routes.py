from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import uuid
import os
from pathlib import Path
from typing import Optional, List

# Import your PDF logic
from app.logic.pdf_generator import generate_pdf, list_available_fonts, test_font_loading, FONT_MAPPING

# Custom template storage directory
CUSTOM_TEMPLATES_DIR = Path(__file__).parent.parent.parent / "static" / "custom_templates"
CUSTOM_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter()

@router.get("/")
async def root():
    """Root endpoint with available fonts info"""
    available = list_available_fonts()
    return {
        "status": "ok",
        "message": "Jersey Print Engine",
        "available_fonts": available,
        "font_count": len(available),
        "font_mapping_count": len(FONT_MAPPING),
        "note": "Check /debug/fonts for detailed font loading info"
    }


@router.get("/debug/fonts")
async def debug_fonts():
    """
    Debug endpoint to check font loading status.
    Returns all available fonts and which ones are mappable.
    """
    available = list_available_fonts()
    
    # Test each font in the mapping
    tested_fonts = []
    for font_name in sorted(set(FONT_MAPPING.values())):
        test_result = test_font_loading(font_name, 48)
        tested_fonts.append({
            "font_file": font_name,
            "success": test_result['success'],
            "path": test_result['font_path'],
            "error": test_result.get('error')
        })
    
    # Check which requested fonts map to existing files
    missing_mappings = []
    for requested, mapped in FONT_MAPPING.items():
        mapped_path = os.path.join(
            Path(__file__).parent.parent.parent / "static" / "fonts",
            mapped
        )
        if not os.path.exists(mapped_path):
            missing_mappings.append({
                "requested": requested,
                "mapped_to": mapped,
                "path_exists": False
            })
    
    return {
        "status": "ok",
        "available_fonts_on_disk": available,
        "total_available": len(available),
        "mappable_fonts": tested_fonts,
        "successful_mappings": len([f for f in tested_fonts if f['success']]),
        "failed_mappings": len([f for f in tested_fonts if not f['success']]),
        "missing_mappings": missing_mappings,  # Mappings pointing to non-existent files
        "all_mappings": FONT_MAPPING
    }


@router.get("/debug/test-font")
async def test_font(font_name: str = Query(..., description="Font name to test (e.g., 'Roboto', 'BebasNeue.ttf')")):
    """
    Test if a specific font can be loaded.
    Use this to debug font loading issues.
    
    Example: GET /debug/test-font?font_name=Roboto
    """
    result = test_font_loading(font_name, 48)
    
    # Get list of similar fonts if not found
    similar = []
    if not result['success'] or result.get('is_default'):
        for available_font in list_available_fonts():
            if font_name.lower().replace(' ', '') in available_font.lower().replace(' ', ''):
                similar.append(available_font)
    
    return {
        "requested_font": font_name,
        "loaded_font": result['font_name'],
        "font_path": result['font_path'],
        "success": result['success'],
        "is_default": result.get('is_default', False),
        "error": result.get('error'),
        "similar_fonts_found": similar,
        "message": "Font loaded successfully" if result['success'] else ("Using PIL default font - check console logs" if result.get('is_default') else "Font not found, see similar_fonts_found")
    }


@router.post("/generate")
@router.post("/generate/") 
async def generate_jersey(
    file: UploadFile = File(...), 
    template_id: str = Form("default"),
    font_file: str = Form("BebasNeue.ttf"),
    name_font: Optional[str] = Form(None), 
    text_color: str = Form("#FFFFFF"),
    name_color: Optional[str] = Form(None), 
    name_x_ratio: float = Form(0.5),
    name_y_ratio: float = Form(0.25),
    number_x_ratio: float = Form(0.5),
    number_y_ratio: float = Form(0.55),
    name_font_size: int = Form(48),
    number_font_size: int = Form(120),
    outline_color: str = Form("#000000"),
    spacing: int = Form(0),
    # Mode parameters
    mode: str = Form("batch"),  # "batch" or "individual"
    manual_name: Optional[str] = Form(None),
    manual_number: Optional[str] = Form(None),
    manual_size: Optional[str] = Form(None),
    selected_player: Optional[str] = Form(None),
    custom_template: Optional[UploadFile] = File(None),
    logos_data: Optional[str] = Form(None),  # JSON string with logos array (new format)
    logo_data: Optional[str] = Form(None),  # JSON string with single logo (legacy format)
):
    # 1. DETECT FILE EXTENSION (Fix for 500 Error)
    original_filename = file.filename if file.filename else "upload.xlsx"
    ext = Path(original_filename).suffix
    if not ext: 
        ext = ".xlsx" # Default fallback
        
    temp_filename = f"temp_{uuid.uuid4().hex}{ext}"
    temp_custom_path = None
    
    try:
        # Save uploaded file
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Save custom template if provided
        if custom_template and custom_template.filename:
            custom_ext = Path(custom_template.filename).suffix
            temp_custom_path = str(CUSTOM_TEMPLATES_DIR / f"custom_{uuid.uuid4().hex}{custom_ext}")
            with open(temp_custom_path, "wb") as buffer:
                shutil.copyfileobj(custom_template.file, buffer)

        # Mapping Logic
        final_font = name_font if name_font else font_file
        final_color = name_color if name_color else text_color

        # Parse logo_data JSON string if provided (legacy single logo format)
        logo_data_dict = None
        if logo_data:
            import json
            try:
                logo_data_dict = json.loads(logo_data)
                print(f"LOGO DEBUG: Parsed single logo_data: {logo_data_dict}")
            except json.JSONDecodeError as e:
                print(f"Warning: Invalid logo_data JSON: {e}")

        # Parse logos_data JSON string if provided (new multiple logos format)
        if logos_data:
            import json
            try:
                logos_data_list = json.loads(logos_data)
                print(f"LOGO DEBUG: Parsed logos_data array: {len(logos_data_list) if isinstance(logos_data_list, list) else 1} logo(s)")
                # Use logos_data (array) as the logo_data for the PDF generator
                # It can be a single object or an array of objects
                logo_data_dict = logos_data_list
            except json.JSONDecodeError as e:
                print(f"Warning: Invalid logos_data JSON: {e}")

        output_pdf_path = generate_pdf(
            excel_path=temp_filename,
            template_id=template_id,
            name_x_ratio=name_x_ratio,
            name_y_ratio=name_y_ratio,
            number_x_ratio=number_x_ratio,
            number_y_ratio=number_y_ratio,
            name_font_size=name_font_size,
            number_font_size=number_font_size,
            font_file=final_font,       
            text_color=final_color,      
            outline_color=outline_color,
            spacing=spacing,
            mode=mode,
            manual_name=manual_name,
            manual_number=manual_number,
            manual_size=manual_size,
            selected_player=selected_player,
            custom_template_path=temp_custom_path,
            logo_data=logo_data_dict,
        )
        
        filename = Path(output_pdf_path).name
        
        return {
            "status": "success",
            "message": "Jersey PDF generated successfully",
            "file_url": f"/static/outputs/{filename}",
            "filename": filename
        }

    except Exception as e:
        import traceback
        traceback.print_exc() 
        raise HTTPException(500, f"Server Error: {str(e)}")
    finally:
        if Path(temp_filename).exists():
            Path(temp_filename).unlink()
        if temp_custom_path and Path(temp_custom_path).exists():
            Path(temp_custom_path).unlink()


@router.post("/generate/individual")
async def generate_individual_jersey(
    template_id: str = Form("default"),
    font_file: str = Form("BebasNeue.ttf"),
    text_color: str = Form("#FFFFFF"),
    number_color: str = Form("#FFFFFF"),
    name_x_ratio: float = Form(0.5),
    name_y_ratio: float = Form(0.25),
    number_x_ratio: float = Form(0.5),
    number_y_ratio: float = Form(0.55),
    name_font_size: int = Form(48),
    number_font_size: int = Form(120),
    outline_color: str = Form("#000000"),
    spacing: int = Form(0),
    manual_name: str = Form(...),
    manual_number: str = Form(...),
    manual_size: str = Form("L"),
    selected_player: Optional[str] = Form(None),
    custom_template: Optional[UploadFile] = File(None),
    logos_data: Optional[str] = Form(None),  # JSON string with logos array (new format)
    logo_data: Optional[str] = Form(None),  # JSON string with single logo (legacy format)
):
    """
    Generate a single jersey PDF without needing an Excel file.
    Useful for individual jersey generation.
    """
    temp_custom_path = None
    
    try:
        # Save custom template if provided
        if custom_template and custom_template.filename:
            custom_ext = Path(custom_template.filename).suffix
            temp_custom_path = str(CUSTOM_TEMPLATES_DIR / f"custom_{uuid.uuid4().hex}{custom_ext}")
            with open(temp_custom_path, "wb") as buffer:
                shutil.copyfileobj(custom_template.file, buffer)

        # Parse logo_data JSON string if provided (legacy single logo format)
        logo_data_dict = None
        if logo_data:
            import json
            try:
                logo_data_dict = json.loads(logo_data)
                print(f"LOGO DEBUG: Parsed single logo_data: {logo_data_dict}")
            except json.JSONDecodeError as e:
                print(f"Warning: Invalid logo_data JSON: {e}")

        # Parse logos_data JSON string if provided (new multiple logos format)
        if logos_data:
            import json
            try:
                logos_data_list = json.loads(logos_data)
                print(f"LOGO DEBUG: Parsed logos_data array: {len(logos_data_list) if isinstance(logos_data_list, list) else 1} logo(s)")
                # Use logos_data (array) as the logo_data for the PDF generator
                # It can be a single object or an array of objects
                logo_data_dict = logos_data_list
            except json.JSONDecodeError as e:
                print(f"Warning: Invalid logos_data JSON: {e}")

        output_pdf_path = generate_pdf(
            excel_path=None,  # No Excel file needed for individual mode
            template_id=template_id,
            name_x_ratio=name_x_ratio,
            name_y_ratio=name_y_ratio,
            number_x_ratio=number_x_ratio,
            number_y_ratio=number_y_ratio,
            name_font_size=name_font_size,
            number_font_size=number_font_size,
            font_file=font_file,
            text_color=text_color,
            number_color=number_color,
            outline_color=outline_color,
            spacing=spacing,
            mode="individual",
            manual_name=manual_name,
            manual_number=manual_number,
            manual_size=manual_size,
            selected_player=selected_player,
            custom_template_path=temp_custom_path,
            logo_data=logo_data_dict if logo_data_dict else None,
        )
        
        filename = Path(output_pdf_path).name
        
        return {
            "status": "success",
            "message": "Individual jersey PDF generated successfully",
            "file_url": f"/static/outputs/{filename}",
            "filename": filename
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Server Error: {str(e)}")
    finally:
        if temp_custom_path and Path(temp_custom_path).exists():
            Path(temp_custom_path).unlink()


# Define the outputs directory
OUTPUTS_DIR = Path(__file__).parent.parent.parent / "static" / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/download/{filename}")
async def download_pdf(filename: str):
    """
    Download a generated PDF file.
    This endpoint is more reliable than StaticFiles for serving generated content.
    """
    # Sanitize filename to prevent path traversal attacks
    safe_filename = Path(filename).name

    # Check for path traversal attempts
    if str(Path(filename)) != safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = OUTPUTS_DIR / safe_filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if not file_path.suffix.lower() == '.pdf':
        raise HTTPException(status_code=400, detail="Only PDF files can be downloaded")

    # Return the file with appropriate headers
    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type='application/pdf'
    )



    
