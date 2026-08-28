import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "FluentAI Backend"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fluentai")
    
    # ── Personal mode ────────────────────────────────────────────────────────
    # A fixed UUID that identifies the single personal user.
    # All API endpoints use this ID instead of a JWT-derived one.
    # Change this value in your .env file if you want to start with a fresh profile.
    PERSONAL_USER_ID: str = os.getenv(
        "PERSONAL_USER_ID", "79b9176f-0638-425b-8118-f3f6255c7121"
    )

    # Supabase Auth JWT Secret for verification (not used in personal mode)
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "change-me-in-production-supabase-jwt-secret")
    
    # Supabase project URL (used for RS256 JWKS endpoint fallback)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    
    # Ollama Local AI Option
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1")
    
    # Speech to Text Configuration
    WHISPER_FALLBACK_TO_GEMINI: bool = os.getenv("WHISPER_FALLBACK_TO_GEMINI", "True").lower() == "true"

settings = Settings()

