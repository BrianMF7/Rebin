from fastapi import APIRouter, HTTPException
from loguru import logger

from schemas import EventCreateRequest, EventCreateResponse
from utils.supabase_client import insert_sort_event

router = APIRouter()


@router.post("", response_model=EventCreateResponse)
async def log_event(payload: EventCreateRequest) -> EventCreateResponse:
    """
    Inserts a sort event into Supabase.
    """
    try:
        logger.info("Inserting sort event into Supabase")
        inserted_id = await insert_sort_event(payload)
        return EventCreateResponse(id=inserted_id)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error during event insert")
        raise HTTPException(
            status_code=500, detail={"error": "server_error", "message": str(exc)}
        )
