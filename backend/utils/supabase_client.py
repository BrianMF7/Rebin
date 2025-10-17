from typing import Any, Dict, List, Optional

from loguru import logger
from supabase import create_client

from schemas import EventCreateRequest
from utils.settings import settings

_supabase = None


def supabase():
    """
    Lazy initialize Supabase client.
    """
    global _supabase
    if _supabase is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("Supabase configuration missing")
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase


async def ensure_seed_policies() -> None:
    """
    Ensure two policy rows exist (NYC, SF).
    """
    try:
        client = supabase()
        existing = client.table("policies").select("*").in_("zip", ["10001", "94103"]).execute()
        found_zips = {row["zip"] for row in existing.data} if existing.data else set()

        seeds: List[Dict[str, Any]] = []
        if "10001" not in found_zips:
            seeds.append(
                {"zip": "10001", "rules_json": {"recycling": ["plastic #1-2", "paper"], "compost": ["food", "yard"], "trash": ["styrofoam"]}}
            )
        if "94103" not in found_zips:
            seeds.append(
                {"zip": "94103", "rules_json": {"recycling": ["glass", "paper", "metal"], "compost": ["food", "soiled paper"], "trash": ["film plastic"]}}
            )
        if seeds:
            client.table("policies").upsert(seeds, on_conflict="zip").execute()
            logger.info("Seeded policies for NYC and SF")
        else:
            logger.info("Policies already seeded")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Policy seed check failed: {exc}")


async def insert_sort_event(payload: EventCreateRequest) -> int:
    """
    Insert a sort event row.
    """
    client = supabase()
    row = {
        "user_id": payload.user_id,
        "zip": payload.zip,
        "items_json": payload.items_json,
        "decision": payload.decision,
        "co2e_saved": payload.co2e_saved,
    }
    res = client.table("sort_events").insert(row).execute()
    inserted = res.data[0]
    return int(inserted["id"])
