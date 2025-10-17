from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ItemDetection(BaseModel):
    label: str = Field(..., description="Detected class label")
    confidence: float = Field(..., ge=0.0, le=1.0)


class InferResponse(BaseModel):
    items: List[ItemDetection]
    zip: Optional[str] = Field(default=None)


class ExplainItem(BaseModel):
    label: str


class ExplainRequest(BaseModel):
    items: List[ExplainItem]
    zip: Optional[str] = Field(default=None)
    policies_json: Optional[Dict[str, Any]] = Field(default=None, description="Policies for ZIP")


class ItemDecision(BaseModel):
    label: str
    bin: str = Field(..., description="recycling | compost | trash")
    explanation: str
    eco_tip: str


class ExplainResponse(BaseModel):
    decisions: List[ItemDecision]


class EventCreateRequest(BaseModel):
    user_id: Optional[str] = Field(default=None)
    zip: Optional[str] = Field(default=None)
    items_json: List[str]
    decision: str
    co2e_saved: float


class EventCreateResponse(BaseModel):
    id: int
