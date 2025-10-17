from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import time

app = FastAPI(title="Mock CV Service", version="1.0.0")


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "cv-mock",
            "timestamp": time.time(),
            "version": "1.0.0"
        }
    )


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return JSONResponse(
        status_code=200,
        content={
            "message": "Mock CV Service",
            "version": "1.0.0",
            "endpoints": ["/predict", "/health", "/docs"]
        }
    )


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Returns a mock detection for demo purposes.
    """
    # Always return two mock detections
    return {
        "objects": [
            {"label": "plastic cup", "confidence": 0.92},
            {"label": "paper lid", "confidence": 0.81},
        ]
    }
