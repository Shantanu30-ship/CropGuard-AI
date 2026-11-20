import io, os
from typing import Any
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from transformers import pipeline

MODEL_ID = os.getenv("MODEL_ID", "neghani/plantvillage-resnet18")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))
MAX_BYTES = 8 * 1024 * 1024

app = FastAPI(title="CropGuard Plant Disease API", version="1.0.0")
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "*").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["*"])
classifier = None

# The model is downloaded from Hugging Face on first startup and cached by the container.
def get_classifier():
    global classifier
    if classifier is None:
        classifier = pipeline("image-classification", model=MODEL_ID, revision="v1.2", device=-1)
    return classifier

@app.get("/")
def root():
    return {"service": "CropGuard AI API", "status": "running", "model": MODEL_ID}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": classifier is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG or WEBP image.")
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 8 MB or smaller.")
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")
    if image.width < 80 or image.height < 80:
        raise HTTPException(status_code=400, detail="Use a clearer image at least 80 x 80 pixels.")
    try:
        results = get_classifier()(image, top_k=3)
    except Exception as exc:
        # Avoid returning internal exception details to the public client.
        raise HTTPException(status_code=503, detail="The AI model is temporarily unavailable. Try again shortly.") from exc
    top = results[0]
    score = float(top["score"])
    label = str(top["label"])
    parts = label.split("___", 1)
    crop = parts[0].replace("_", " ").replace(",", "") if len(parts) == 2 else "Unknown crop"
    condition = parts[1].replace("_", " ") if len(parts) == 2 else label
    readable = condition.replace("  ", " ").strip()
    return {
        "prediction": label,
        "crop": crop,
        "condition": readable,
        "confidence": round(score * 100, 2),
        "status": "prediction" if score >= CONFIDENCE_THRESHOLD else "uncertain",
        "threshold": CONFIDENCE_THRESHOLD,
        "top3": [{"label": str(x["label"]), "confidence": round(float(x["score"]) * 100, 2)} for x in results],
        "notice": "AI image classification is an educational aid, not a confirmed diagnosis. Field-photo performance can be substantially lower than benchmark results."
    }
