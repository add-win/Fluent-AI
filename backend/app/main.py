from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uvicorn

from .core.config import settings
from .core.database import get_db
from .api import endpoints

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="FluentAI API backend - Personal English Communication Coach"
)

# CORS configuration
# allow_origins=["*"] is required — FastAPI CORSMiddleware does NOT support
# wildcard subdomain patterns like "https://*.vercel.app". Only bare "*" works.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the routes
app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def read_root(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        # Check DB connection
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "database": db_status,
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY)
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
