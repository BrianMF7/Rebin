from fastapi import FastAPI, File, UploadFile, HTTPException
import logging, io
import numpy as np
from PIL import Image

# --- PyTorch safe allow-list MUST come before any model load ---
import torch
from torch.serialization import add_safe_globals, safe_globals
from ultralytics.nn.tasks import DetectionModel           # import the class itself
import torch.nn.modules.container as container            # Sequential lives here

# allow-list both classes you’ll see in YOLOv8 checkpoints
add_safe_globals([DetectionModel, container.Sequential])

from ultralytics import YOLO  # import after the allow-list so internal loads are safe

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YOLOv8n Local Service")

try:
    # wrap the load in a safe_globals context to be extra sure
    with safe_globals([DetectionModel, container.Sequential]):
        model = YOLO("yolov8n.pt")  # <-- DO NOT call torch.load yourself
    logger.info("YOLOv8n model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLOv8n model: {e}")
    model = None

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="YOLOv8n model not loaded")
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image_array = np.array(image)

        results = model(image_array, conf=0.5)

        detections = []
        for r in results:
            if r.boxes is not None:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    label = model.names[class_id]
                    conf = float(box.conf[0])
                    detections.append({"label": label, "confidence": conf})

        return {"objects": detections}
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
