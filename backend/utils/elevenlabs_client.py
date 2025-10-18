import base64
import tempfile
from typing import Optional, Dict, Any
from pathlib import Path

from fastapi import HTTPException
from loguru import logger

from utils.http_client import http_client
from utils.settings import settings


# Voice personality configurations
VOICE_PERSONALITIES = {
    "friendly": {
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Default friendly voice
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.7,
            "style": 0.3,
            "use_speaker_boost": True
        }
    },
    "enthusiastic": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # More energetic voice
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.8,
            "style": 0.6,
            "use_speaker_boost": True
        }
    },
    "educational": {
        "voice_id": "VR6AewLTigWG4xSOukaG",  # Clear, professional voice
        "voice_settings": {
            "stability": 0.8,
            "similarity_boost": 0.6,
            "style": 0.2,
            "use_speaker_boost": True
        }
    }
}


async def get_tts_audio_data(
    text: str, 
    voice_personality: str = "friendly"
) -> Optional[bytes]:
    """
    Convert text to speech using ElevenLabs and return the audio data as bytes.
    
    Args:
        text: Text to convert to speech
        voice_personality: Voice personality to use ("friendly", "enthusiastic", "educational")
    
    Returns:
        Audio data as bytes (MP3 format) or None if failed
    """
    if not settings.ELEVENLABS_API_KEY:
        logger.warning("ElevenLabs API key not configured")
        return None

    # Get voice configuration
    voice_config = VOICE_PERSONALITIES.get(voice_personality, VOICE_PERSONALITIES["friendly"])
    
    try:
        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }
        body = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": voice_config["voice_settings"],
        }

        resp = await http_client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_config['voice_id']}",
            headers=headers,
            json=body,
            timeout=30.0,
        )

        if resp.status_code != 200:
            logger.error(f"ElevenLabs error: {resp.status_code} {resp.text}")
            return None

        return resp.content

    except Exception as exc:  # noqa: BLE001
        logger.error(f"ElevenLabs TTS failed: {exc}")
        return None


async def get_tts_base64(
    text: str, 
    voice_personality: str = "friendly"
) -> Optional[str]:
    """
    Convert text to speech using ElevenLabs and return as base64 data URL.
    
    Args:
        text: Text to convert to speech
        voice_personality: Voice personality to use
    
    Returns:
        Base64 data URL (data:audio/mpeg;base64,...) or None if failed
    """
    audio_data = await get_tts_audio_data(text, voice_personality)
    if audio_data is None:
        return None
    
    try:
        base64_audio = base64.b64encode(audio_data).decode('utf-8')
        return f"data:audio/mpeg;base64,{base64_audio}"
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Failed to encode audio to base64: {exc}")
        return None


async def save_tts_to_file(
    text: str, 
    voice_personality: str = "friendly",
    filename: Optional[str] = None
) -> Optional[str]:
    """
    Convert text to speech and save to a temporary file.
    
    Args:
        text: Text to convert to speech
        voice_personality: Voice personality to use
        filename: Optional custom filename (without extension)
    
    Returns:
        Path to the saved audio file or None if failed
    """
    audio_data = await get_tts_audio_data(text, voice_personality)
    if audio_data is None:
        return None
    
    try:
        # Create temporary file
        if filename:
            temp_file = tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=".mp3", 
                prefix=f"{filename}_"
            )
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        
        temp_file.write(audio_data)
        temp_file.close()
        
        return temp_file.name
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Failed to save audio to file: {exc}")
        return None


# Legacy function for backward compatibility
async def get_tts_url(text: str) -> Optional[str]:
    """
    Legacy function - converts text to speech and returns base64 data URL.
    """
    return await get_tts_base64(text, "friendly")
