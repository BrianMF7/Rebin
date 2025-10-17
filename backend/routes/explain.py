from typing import List

from fastapi import APIRouter, HTTPException
from loguru import logger

from schemas import ExplainRequest, ExplainResponse, ItemDecision
from utils.openrouter_client import get_reasoned_decisions

router = APIRouter()


@router.post("", response_model=ExplainResponse)
async def explain(payload: ExplainRequest) -> ExplainResponse:
    """
    Calls the reasoning API to determine bin decisions and tips.
    """
    try:
        logger.info("Calling reasoning API for explanation")
        decisions: List[ItemDecision] = await get_reasoned_decisions(
            items=[i.label for i in payload.items],
            zip_code=payload.zip,
            local_policies=payload.policies_json,
        )
        return ExplainResponse(decisions=decisions)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error during explain")
        raise HTTPException(
            status_code=500, detail={"error": "server_error", "message": str(exc)}
        )
