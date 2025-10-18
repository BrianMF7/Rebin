from typing import Optional

from fastapi import HTTPException
from loguru import logger

from utils.http_client import http_client
from utils.settings import ELEVENLABS_API_KEY


async def get_tts_url(text: str) -> Optional[str]:
    """
    Convert text to speech using ElevenLabs and return the MP3 URL.
    """
    if not ELEVENLABS_API_KEY:
        logger.warning("ElevenLabs API key not configured")
        return None

    try:
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }
        body = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
            },
        }

        resp = await http_client.post(
            "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
            headers=headers,
            json=body,
            timeout=30.0,
        )

        if resp.status_code != 200:
            logger.error(f"ElevenLabs error: {resp.status_code} {resp.text}")
            return None

        # Return the audio data as base64 or save to temp file
        # For simplicity, we'll return a placeholder URL
        return f"data:audio/mpeg;base64,{resp.content.decode('utf-8')}"

    except Exception as exc:  # noqa: BLE001
        logger.error(f"ElevenLabs TTS failed: {exc}")
        return None
