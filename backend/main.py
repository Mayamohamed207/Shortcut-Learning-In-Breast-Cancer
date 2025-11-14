from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from torchvision.models import resnet18
import io
import logging
import os
import tempfile
from monai.transforms import LoadImage, EnsureChannelFirst, Compose
from pydantic import BaseModel

# ============================
# SETUP
# ============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mammogram Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global
model = None
transform = None

AVAILABLE_MODELS = {
    "Image Only": "./models/image_only.pth",
    "Segmented Model": "./models/segmented_model.pth"
}
current_model_name = "Image Only"

# ============================
# LOAD MODEL
# ============================
def load_model(model_name: str = "Image Only"):
    """Load trained model"""
    global model, transform, current_model_name
    try:
        checkpoint_path = AVAILABLE_MODELS.get(model_name, "./models/image_only.pth")
        print(f"Loading checkpoint: {checkpoint_path}")
        
        torch.manual_seed(42)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(42)

        model = resnet18(pretrained=False)
        model.conv1 = torch.nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)

        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"Model checkpoint not found at {checkpoint_path}")

        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        
        if 'fc.1.weight' in checkpoint:
            num_classes = checkpoint['fc.1.weight'].shape[0]
            model.fc = torch.nn.Sequential(torch.nn.Linear(512, num_classes))
        
        model.load_state_dict(checkpoint, strict=False)
        model.eval()
        torch.set_grad_enabled(False)

        transform = Compose([
            LoadImage(image_only=True),
            EnsureChannelFirst(),
        ])

        current_model_name = model_name
        return True

    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# ============================
# FASTAPI EVENTS
# ============================
@app.on_event("startup")
async def startup_event():
    """Load default model at startup"""
    success = load_model()
    if not success:
        logger.warning("Model failed to load at startup")

# ============================
# ROUTES
# ============================
@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "model_loaded": model is not None,
        "gradients_enabled": torch.is_grad_enabled()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "model_not_loaded",
        "cuda_available": torch.cuda.is_available(),
        "gradients_enabled": torch.is_grad_enabled(),
        "model_training_mode": model.training if model else None,
        "current_model": current_model_name
    }


class SwitchModelRequest(BaseModel):
    model_name: str

@app.post("/switch_model")
async def switch_model(request: SwitchModelRequest):
    """Switch model dynamically"""
    success = load_model(request.model_name)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {request.model_name}")
    return {"status": "success", "model_loaded": request.model_name}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """ Predict cancer from uploaded mammogram image """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_file_path = None
    try:
        image_bytes = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name
        
        x = transform(temp_file_path).unsqueeze(0)
        if x.shape[1] == 1:
            x = x.repeat(1, 3, 1, 1)
        x = x.clone().detach()

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        model.eval()
        with torch.no_grad():
            output = model(x)
            pred_idx = torch.argmax(output, dim=1).item()
        
        true_label = "Cancer" if pred_idx == 0 else "Negative"

        return {
            "prediction": int(pred_idx),
            "label": true_label,
            "filename": file.filename,
        }

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    finally:
        if temp_file_path is not None:
            try:
                os.unlink(temp_file_path)
            except:
                pass

# ============================
# RUN SERVER
# ============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
