import json
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from loguru import logger

from schemas import ItemDecision
from utils.http_client import http_client
from utils.settings import OPENROUTER_API_KEY, OPENROUTER_MODEL

SYSTEM_PROMPT = (
    "You are a zero-shot waste sorting expert. "
    "For each item, decide if it goes to recycling, compost, or trash. "
    "Respect local policy overrides when provided. Return concise explanations and an eco-tip."
)


async def get_reasoned_decisions(
    items: List[str],
    zip_code: Optional[str],
    local_policies: Optional[Dict[str, Any]],
) -> List[ItemDecision]:
    """
    Calls OpenRouter for structured decisions, with optional local policy context.
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY is empty or missing")
        raise HTTPException(status_code=500, detail={"error": "config", "message": "OPENROUTER_API_KEY missing"})
    
    logger.info(f"Using OpenRouter API key: {OPENROUTER_API_KEY[:10]}...")

    user_context = {
        "zip": zip_code,
        "policies": local_policies or {},
        "items": items,
    }

    prompt = (
        f"{SYSTEM_PROMPT}\n"
        f"ZIP: {zip_code}\n"
        f"Local Policies JSON: {json.dumps(local_policies or {})}\n"
        f"Items: {', '.join(items)}\n"
        "Respond as JSON list with objects: {label, bin, explanation, eco_tip}. Only these keys."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://rebin.local",
        "X-Title": "ReBin Pro",
        "Content-Type": "application/json",
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    logger.info("Requesting OpenRouter reasoning")
    try:
        resp = await http_client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body, timeout=40.0)
    except Exception as e:
        logger.error(f"OpenRouter request failed: {e}")
        raise HTTPException(status_code=503, detail={"error": "reasoning_error", "message": "Reasoning service unavailable"})
    
    if resp.status_code == 401:
        logger.error("OpenRouter authentication failed - invalid API key")
        raise HTTPException(status_code=500, detail={"error": "config_error", "message": "Invalid API key for reasoning service"})
    elif resp.status_code == 429:
        logger.error("OpenRouter rate limit exceeded")
        raise HTTPException(status_code=429, detail={"error": "rate_limit", "message": "Too many requests to reasoning service"})
    elif resp.status_code == 500:
        logger.error("OpenRouter internal server error")
        raise HTTPException(status_code=502, detail={"error": "reasoning_error", "message": "Reasoning service temporarily unavailable"})
    elif resp.status_code != 200:
        logger.error(f"OpenRouter error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=502, detail={"error": "reasoning_error", "message": "Reasoning API failed"})

    try:
        data = resp.json()
    except Exception as e:
        logger.error(f"Invalid JSON response from OpenRouter: {e}")
        raise HTTPException(status_code=502, detail={"error": "reasoning_error", "message": "Invalid response from reasoning service"})
    
    try:
        if "choices" not in data or not data["choices"]:
            logger.error(f"Invalid response structure from OpenRouter: {data}")
            raise HTTPException(status_code=502, detail={"error": "reasoning_error", "message": "Invalid response structure from reasoning service"})
        
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        
        if not isinstance(parsed, list):
            logger.error(f"Expected list from OpenRouter, got: {type(parsed)}")
            raise HTTPException(status_code=502, detail={"error": "parse_error", "message": "Invalid response format from reasoning service"})
        
        results: List[ItemDecision] = []
        for i, obj in enumerate(parsed):
            try:
                if not isinstance(obj, dict):
                    logger.warning(f"Skipping invalid decision object at index {i}: {obj}")
                    continue
                    
                results.append(
                    ItemDecision(
                        label=str(obj.get("label", "")),
                        bin=str(obj.get("bin", "")),
                        explanation=str(obj.get("explanation", "")),
                        eco_tip=str(obj.get("eco_tip", "")),
                    )
                )
            except Exception as e:
                logger.warning(f"Skipping invalid decision object at index {i}: {obj}, error: {e}")
                continue
        
        if not results:
            logger.warning("No valid decisions parsed from OpenRouter response")
            # Return a fallback decision
            results = [
                ItemDecision(
                    label="unknown",
                    bin="trash",
                    explanation="Unable to determine proper disposal method",
                    eco_tip="Please check local recycling guidelines"
                )
            ]
        
        logger.info(f"Successfully parsed {len(results)} decisions from OpenRouter")
        return results
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from OpenRouter response: {e}")
        raise HTTPException(status_code=502, detail={"error": "parse_error", "message": "Invalid JSON response from reasoning service"})
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Failed parsing reasoning response: {exc}")
        raise HTTPException(status_code=502, detail={"error": "parse_error", "message": "Bad reasoning response"})
