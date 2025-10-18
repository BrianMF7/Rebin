import base64
import tempfile
from typing import Optional, Dict, Any, List
from pathlib import Path

from fastapi import HTTPException
from loguru import logger

from utils.http_client import http_client
from utils.settings import ELEVENLABS_API_KEY


# Voice personality configurations with avatar metadata
VOICE_PERSONALITIES = {
    "friendly": {
        "voice_id": "s3TPKV1kjDlVtZbl4Ksh",  # Default friendly voice
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.7,
            "style": 0.3,
            "use_speaker_boost": True
        },
        "avatar": {
            "name": "Green Gary",
            "gender": "male",
            "description": "A friendly, approachable guide who makes recycling feel easy and natural",
            "personality_traits": ["encouraging", "patient", "warm", "supportive"],
            "color_theme": "#4CAF50"  # Green theme
        }
    },
    "enthusiastic": {
        "voice_id": "y3H6zY6KvCH2pEuQjmv8",  # More energetic voice
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.8,
            "style": 0.6,
            "use_speaker_boost": True
        },
        "avatar": {
            "name": "Eco Emma",
            "gender": "female",
            "description": "An energetic environmental enthusiast who gets excited about sustainable practices",
            "personality_traits": ["energetic", "passionate", "motivating", "inspiring"],
            "color_theme": "#FF9800"  # Orange theme
        }
    },
    "educational": {
        "voice_id": "onwK4e9ZLuTAKqWW03F9",  # Clear, professional voice
        "voice_settings": {
            "stability": 0.8,
            "similarity_boost": 0.6,
            "style": 0.2,
            "use_speaker_boost": True
        },
        "avatar": {
            "name": "Professor Pete",
            "gender": "male",
            "description": "A knowledgeable educator who provides clear, informative guidance on waste management",
            "personality_traits": ["knowledgeable", "clear", "professional", "informative"],
            "color_theme": "#2196F3"  # Blue theme
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
    if not ELEVENLABS_API_KEY:
        logger.warning("ElevenLabs API key not configured")
        return None

    # Get voice configuration
    voice_config = VOICE_PERSONALITIES.get(voice_personality, VOICE_PERSONALITIES["friendly"])
    
    try:
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
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


def get_voice_personalities() -> Dict[str, Any]:
    """
    Get all available voice personalities with their configurations.
    
    Returns:
        Dictionary containing all voice personality configurations
    """
    return VOICE_PERSONALITIES


def get_voice_personality(personality_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific voice personality configuration by ID.
    
    Args:
        personality_id: The personality ID ("friendly", "enthusiastic", "educational")
    
    Returns:
        Voice personality configuration or None if not found
    """
    return VOICE_PERSONALITIES.get(personality_id)


def get_avatar_configurations() -> List[Dict[str, Any]]:
    """
    Get all avatar configurations for available voice personalities.
    
    Returns:
        List of avatar configurations with voice personality mappings
    """
    avatars = []
    for personality_id, config in VOICE_PERSONALITIES.items():
        avatar_config = {
            "personality_id": personality_id,
            "voice_id": config["voice_id"],
            "avatar": config["avatar"]
        }
        avatars.append(avatar_config)
    return avatars


def get_avatar_configuration(personality_id: str) -> Optional[Dict[str, Any]]:
    """
    Get avatar configuration for a specific voice personality.
    
    Args:
        personality_id: The personality ID ("friendly", "enthusiastic", "educational")
    
    Returns:
        Avatar configuration or None if not found
    """
    config = VOICE_PERSONALITIES.get(personality_id)
    if config:
        return {
            "personality_id": personality_id,
            "voice_id": config["voice_id"],
            "avatar": config["avatar"]
        }
    return None


# Legacy function for backward compatibility
async def get_tts_url(text: str) -> Optional[str]:
    """
    Legacy function - converts text to speech and returns base64 data URL.
    """
    return await get_tts_base64(text, "friendly")
