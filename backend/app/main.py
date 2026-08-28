from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# Custom CORS Middleware to guarantee OPTIONS preflight and 500 errors always return CORS headers
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
        
    try:
        response = await call_next(request)
    except Exception as exc:
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(exc)}"}
        )
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Standard Starlette CORS middleware fallback
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the routes
app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def read_root(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
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
