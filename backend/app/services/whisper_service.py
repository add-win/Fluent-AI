import io
import os
import tempfile
import google.generativeai as genai
from ..core.config import settings

# Lazy loading for faster-whisper to keep initial load lightweight
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            # Load smallest model on CPU with int8 quantization to fit in low-memory environments
            _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        except Exception as e:
            print(f"Failed to load faster-whisper model locally: {e}")
            _whisper_model = False
    return _whisper_model

def transcribe_audio_gemini(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """Uses Gemini API's native multimodal capability to transcribe audio."""
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key is not configured.")
        
    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        # Determine correct audio mime type
        # browser recording is usually audio/webm, audio/ogg or audio/wav
        supported_mime = mime_type
        if "webm" in mime_type:
            supported_mime = "audio/webm"
        elif "wav" in mime_type:
            supported_mime = "audio/wav"
        elif "ogg" in mime_type:
            supported_mime = "audio/ogg"
        elif "mp3" in mime_type:
            supported_mime = "audio/mp3"
        else:
            supported_mime = "audio/wav"

        response = model.generate_content([
            {
                "mime_type": supported_mime,
                "data": audio_bytes
            },
            "Transcribe this English spoken audio content exactly as it is spoken. Do not paraphrase or add any response meta-text, just provide the exact transcription. If silent or empty, return an empty string."
        ])
        
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Speech-to-Text failed: {e}")
        raise e

def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """
    Transcribes audio bytes into text.
    Uses Gemini Multimodal STT by default if settings allow,
    falling back to local Faster-Whisper.
    """
    # 1. Try Gemini API first if configured and enabled
    if settings.WHISPER_FALLBACK_TO_GEMINI and settings.GEMINI_API_KEY:
        try:
            print("Using Gemini Speech-to-Text...")
            return transcribe_audio_gemini(audio_bytes, mime_type)
        except Exception as gemini_err:
            print(f"Gemini STT failed: {gemini_err}. Attempting local Faster-Whisper...")

    # 2. Try local Faster-Whisper
    whisper = get_whisper_model()
    if whisper:
        try:
            print("Using local Faster-Whisper...")
            # Save audio bytes to a temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name
            
            try:
                segments, info = whisper.transcribe(temp_path, beam_size=5)
                text = " ".join([segment.text for segment in segments])
                return text.strip()
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        except Exception as whisper_err:
            print(f"Local Faster-Whisper transcription failed: {whisper_err}")
            
    # Final fallback if everything fails
    return "Error transcribing audio. Check your configuration."
