from fastapi import FastAPI, File, UploadFile

app = FastAPI(title="Mock CV Service")


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
