import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import logging

# IMPORT ROUTERS (This connects your old logic to the new system)
from app.routers import logo_routes, jersey_routes

# SETUP LOGGING
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Printing Backend API", version="3.0.0")

# 1. SETUP CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# 2. SETUP DIRECTORIES (The New Way)
# We go up two levels: app -> print-engine -> static
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
FONTS_DIR = STATIC_DIR / "fonts"

# Ensure directories exist
STATIC_DIR.mkdir(parents=True, exist_ok=True)
FONTS_DIR.mkdir(parents=True, exist_ok=True)

# Mount Static Files (So you can download generated images)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# 3. INCLUDE ROUTERS
# We map the logo/jersey logic to specific URLs
app.include_router(logo_routes.router)   # This exposes /arrange
app.include_router(jersey_routes.router) # This exposes /generate

# 4. RESTORE OLD HEALTH CHECK
@app.get("/")
async def health():
    # Scan the NEW fonts folder to show in the JSON
    font_list = [f.name for f in FONTS_DIR.glob("*.[tT][tT][fF]")] # Matches .ttf and .TTF
    
    return {
        "status": "Printing Backend Running",
        "jersey_api": "enabled",
        "logo_api": "enabled",
        "available_fonts": font_list,
        "location": str(STATIC_DIR)
    }

# 5. RUN SERVER
if __name__ == "__main__":
    # Changed host to 127.0.0.1 as per your request
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)