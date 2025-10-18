from typing import List
import random
import re

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from loguru import logger

from schemas import (
    ChatbotRequest, 
    ChatbotResponse, 
    ItemDecision,
    VoicePersonalityResponse,
    AvatarResponse,
    VoicePersonality,
    AvatarConfiguration,
    AvatarInfo,
    VoiceSettings
)
from utils.elevenlabs_client import (
    get_tts_base64,
    get_voice_personalities,
    get_avatar_configurations
)

security = HTTPBearer(auto_error=False)

router = APIRouter()


def sanitize_text(text: str) -> str:
    """
    Sanitize text to prevent injection attacks and ensure safe TTS generation.
    """
    # Remove potentially harmful characters and limit length
    text = re.sub(r'[<>"\']', '', text)
    text = text[:1000]  # Limit to 1000 characters
    return text.strip()


def generate_conversational_text(decisions: List[ItemDecision], voice_personality: str, include_eco_tips: bool) -> str:
    """
    Generate engaging conversational text from ItemDecision objects.
    """
    if not decisions:
        return "I don't see any items to analyze. Please try uploading a photo!"
    
    # Voice personality templates
    personality_templates = {
        "friendly": {
            "greeting": ["Great!", "Awesome!", "Perfect!", "Excellent!"],
            "item_intro": "I found {count} item{plural} in your image",
            "bin_decision": "This {item} goes in the {bin} bin because {explanation}",
            "eco_tip_intro": "Here's a fun fact:",
            "eco_tip": "{eco_tip}",
            "closing": ["Every small action counts towards a greener planet! 🌱", "You're making a difference! 🌍", "Keep up the great work! ♻️"]
        },
        "enthusiastic": {
            "greeting": ["Fantastic!", "Amazing!", "Incredible!", "Outstanding!"],
            "item_intro": "I detected {count} amazing item{plural} in your photo",
            "bin_decision": "This {item} belongs in the {bin} bin! Here's why: {explanation}",
            "eco_tip_intro": "Get this exciting fact:",
            "eco_tip": "{eco_tip}",
            "closing": ["You're absolutely crushing it for the environment! 🌟", "This is how we save the planet! 🚀", "You're an eco-hero! 💚"]
        },
        "educational": {
            "greeting": ["Let me analyze this for you.", "I'll help you sort these items correctly.", "Here's what I found:"],
            "item_intro": "I've identified {count} item{plural} in your image",
            "bin_decision": "The {item} should be placed in the {bin} bin. The reasoning is: {explanation}",
            "eco_tip_intro": "Additional information:",
            "eco_tip": "{eco_tip}",
            "closing": ["Proper sorting contributes to environmental sustainability.", "Thank you for taking the time to sort correctly.", "Your efforts help reduce waste and pollution."]
        }
    }
    
    template = personality_templates.get(voice_personality, personality_templates["friendly"])
    
    # Start with greeting
    greeting = random.choice(template["greeting"])
    
    # Count items
    item_count = len(decisions)
    plural = "s" if item_count > 1 else ""
    
    # Build the conversation
    conversation_parts = [greeting]
    
    # Add item introduction
    conversation_parts.append(template["item_intro"].format(count=item_count, plural=plural))
    
    # Add each item decision
    for i, decision in enumerate(decisions):
        bin_name = decision.bin.replace("_", " ").title()
        if decision.bin == "recycling":
            bin_name = "recycling"
        elif decision.bin == "compost":
            bin_name = "compost"
        elif decision.bin == "trash":
            bin_name = "trash"
        
        item_text = template["bin_decision"].format(
            item=decision.label,
            bin=bin_name,
            explanation=decision.explanation
        )
        conversation_parts.append(item_text)
        
        # Add eco tip if requested
        if include_eco_tips and decision.eco_tip:
            eco_tip_text = f"{template['eco_tip_intro']} {template['eco_tip'].format(eco_tip=decision.eco_tip)}"
            conversation_parts.append(eco_tip_text)
    
    # Add closing
    closing = random.choice(template["closing"])
    conversation_parts.append(closing)
    
    # Join and sanitize the final text
    final_text = " ".join(conversation_parts)
    return sanitize_text(final_text)


def generate_fallback_text(decisions: List[ItemDecision]) -> str:
    """
    Generate simple fallback text without personality for when TTS fails.
    """
    if not decisions:
        return "No items detected. Please try uploading a photo."
    
    parts = []
    for decision in decisions:
        bin_name = decision.bin.replace("_", " ").title()
        if decision.bin == "recycling":
            bin_name = "recycling"
        elif decision.bin == "compost":
            bin_name = "compost"
        elif decision.bin == "trash":
            bin_name = "trash"
        
        parts.append(f"{decision.label}: {bin_name} bin. {decision.explanation}")
        if decision.eco_tip:
            parts.append(f"Eco tip: {decision.eco_tip}")
    
    fallback_text = " | ".join(parts)
    return sanitize_text(fallback_text)


@router.post("/speak", response_model=ChatbotResponse)
async def speak_decisions(request: ChatbotRequest):
    """
    Convert ItemDecision objects into conversational speech using ElevenLabs TTS.
    """
    try:
        # Validate input
        if not request.decisions:
            raise HTTPException(status_code=400, detail="No decisions provided")
        
        if len(request.decisions) > 10:  # Rate limiting
            raise HTTPException(status_code=400, detail="Too many items (max 10)")
        
        # Sanitize all decision data
        for decision in request.decisions:
            decision.label = sanitize_text(decision.label)
            decision.explanation = sanitize_text(decision.explanation)
            decision.eco_tip = sanitize_text(decision.eco_tip)
        # Validate voice personality
        valid_personalities = ["friendly", "enthusiastic", "educational"]
        voice_personality = request.voice_personality
        if voice_personality not in valid_personalities:
            voice_personality = "friendly"
            logger.warning(f"Invalid voice personality '{request.voice_personality}', using 'friendly'")
        
        # Generate conversational text
        conversational_text = generate_conversational_text(
            request.decisions, 
            voice_personality, 
            request.include_eco_tips
        )
        
        # Generate fallback text
        fallback_text = generate_fallback_text(request.decisions)
        
        # Generate TTS audio
        audio_url = None
        try:
            audio_url = await get_tts_base64(conversational_text, voice_personality)
            if audio_url is None:
                logger.warning("TTS generation failed, will use fallback text")
        except Exception as exc:
            logger.error(f"TTS generation error: {exc}")
        
        return ChatbotResponse(
            audio_url=audio_url,
            conversational_text=conversational_text,
            fallback_text=fallback_text,
            voice_personality=voice_personality
        )
        
    except Exception as exc:
        logger.error(f"Chatbot speak endpoint error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")


@router.get("/voices", response_model=VoicePersonalityResponse)
async def get_available_voices():
    """
    Get available voice personalities with their configurations and avatar information.
    
    Returns:
        VoicePersonalityResponse: Complete voice personality configurations including avatar data
    """
    try:
        voice_personalities = get_voice_personalities()
        voices = []
        
        for personality_id, config in voice_personalities.items():
            voice_personality = VoicePersonality(
                personality_id=personality_id,
                voice_id=config["voice_id"],
                voice_settings=VoiceSettings(**config["voice_settings"]),
                avatar=AvatarInfo(**config["avatar"])
            )
            voices.append(voice_personality)
        
        return VoicePersonalityResponse(voices=voices)
        
    except Exception as exc:
        logger.error(f"Error retrieving voice personalities: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve voice personalities")


@router.post("/tts", response_model=dict)
async def simple_tts(request: dict):
    """
    Simple TTS endpoint for avatar system that takes text and voice personality.
    """
    try:
        text = request.get("text", "")
        voice_personality = request.get("voice_personality", "friendly")
        
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
        
        # Sanitize text
        text = sanitize_text(text)
        
        # Validate voice personality
        valid_personalities = ["friendly", "enthusiastic", "educational"]
        if voice_personality not in valid_personalities:
            voice_personality = "friendly"
            logger.warning(f"Invalid voice personality '{voice_personality}', using 'friendly'")
        
        # Generate TTS audio
        audio_url = None
        try:
            audio_url = await get_tts_base64(text, voice_personality)
            if audio_url is None:
                logger.warning("TTS generation failed")
        except Exception as exc:
            logger.error(f"TTS generation error: {exc}")
        
        return {
            "audio_url": audio_url,
            "text": text,
            "voice_personality": voice_personality,
            "success": audio_url is not None
        }
        
    except Exception as exc:
        logger.error(f"Simple TTS endpoint error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")


@router.get("/avatars", response_model=AvatarResponse)
async def get_avatar_configurations():
    """
    Get avatar configurations for all available voice personalities.
    
    Returns:
        AvatarResponse: List of avatar configurations with voice personality mappings
    """
    try:
        avatar_configs = get_avatar_configurations()
        avatars = []
        
        for config in avatar_configs:
            avatar_config = AvatarConfiguration(
                personality_id=config["personality_id"],
                voice_id=config["voice_id"],
                avatar=AvatarInfo(**config["avatar"])
            )
            avatars.append(avatar_config)
        
        return AvatarResponse(avatars=avatars)
        
    except Exception as exc:
        logger.error(f"Error retrieving avatar configurations: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve avatar configurations")
