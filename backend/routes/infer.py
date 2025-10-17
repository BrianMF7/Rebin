from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from schemas import InferResponse, ItemDetection
from utils.http_client import http_client
from utils.settings import settings

router = APIRouter()


@router.post("", response_model=InferResponse)
async def infer(
    file: UploadFile = File(..., description="Image file"),
    zip: Optional[str] = Form(default=None),
) -> InferResponse:
    """
    Calls the CV endpoint (YOLOv8n on Gradient or mock) and returns detected items.
    """
    try:
        files = {"file": (file.filename, await file.read(), file.content_type or "image/jpeg")}
        target = settings.GRADIENT_INFER_URL
        logger.info(f"Calling CV endpoint: {target}")
        resp = await http_client.post(target, files=files, timeout=30.0)
        if resp.status_code != 200:
            logger.error(f"CV call failed: {resp.status_code} {resp.text}")
            raise HTTPException(
                status_code=502,
                detail={"error": "cv_error", "message": "Computer vision service failed"},
            )

        data = resp.json()
        items: List[ItemDetection] = []
        for obj in data.get("objects", []):
            items.append(
                ItemDetection(
                    label=str(obj.get("label", "unknown")),
                    confidence=float(obj.get("confidence", 0.0)),
                )
            )
        return InferResponse(items=items, zip=zip)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error during infer")
        raise HTTPException(
            status_code=500, detail={"error": "server_error", "message": str(exc)}
        )
