from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision.models import resnet18
import logging
import os
import tempfile
import cv2
import numpy as np
from typing import Optional
from monai.visualize import GradCAM, GradCAMpp
import base64
from io import BytesIO
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib
from matplotlib.cm import ScalarMappable
from matplotlib.colors import Normalize
matplotlib.use('Agg')
import pandas as pd

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

model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
gradcam = None
gradcampp = None

AVAILABLE_MODELS = {
    "Base Model": "./models/all-exams-weighted-sampling-pytorch-default-v1/base_model_epoch_4.pth",
    "Segmented Model": "./models/all-exams-weighted-sampling-pytorch-default-v1/segmented_model_epoch_12.pth",
    "Background Model": "./models/all-exams-weighted-sampling-pytorch-default-v1/background_model_epoch_7.pth"
}
current_model_name = "Base Model"

PREDICTIONS_CSV_PATHS = {
    "base_model": "./predictions_subgroups/BaseModel_predictions_per_subgroup.csv",
    "segmented_model": "./predictions_subgroups/segmented_predictions_per_subgroup.csv",
    "background_model": "./predictions_subgroups/background_predictions_per_subgroup.csv",
}

test_metadata = None
predictions_cache = {}
evaluation_cache = {}

def minmax_normalize_image(img):
    img_float = np.array(img).astype(np.float32)
    min_val, max_val = img_float.min(), img_float.max()
    range_val = max_val - min_val
    
    if range_val == 0:
        return torch.zeros((3, 224, 224))
    
    normalized = (img_float - min_val) / range_val
    return torch.from_numpy(normalized).permute(2, 0, 1)

def show_cam_on_image(image, mask, alpha=0.5, title=None, pred=None, true=None):
    image = image.detach().cpu().numpy()
    if image.ndim == 3:
        image = np.transpose(image, (1, 2, 0))
    image = image[..., ::-1] 
    
    img_min, img_max = image.min(), image.max()
    image = (image - img_min) / (img_max - img_min + 1e-8)
    mask = mask.detach().cpu().numpy().squeeze()
    mask = (mask - mask.min()) / (mask.max() - mask.min() + 1e-8)
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
    heatmap = plt.get_cmap("jet")(mask)[:, :, :3]
    overlay = (1 - alpha) * image + alpha * heatmap
    return overlay, mask, image.shape

def load_model(model_name: str = "Base Model"):
    global model, current_model_name, gradcam, gradcampp, evaluation_cache
    try:
        checkpoint_path = AVAILABLE_MODELS.get(model_name, AVAILABLE_MODELS["Base Model"])
        logger.info(f"Loading checkpoint: {checkpoint_path}")
        
        torch.manual_seed(42)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(42)

        model = resnet18(pretrained=False)
        
        if not os.path.exists(checkpoint_path):
            logger.warning(f"Model checkpoint not found at {checkpoint_path}, creating dummy model")
            model.fc = nn.Sequential(
                nn.Dropout(p=0.6),
                nn.Linear(512, 1)
            )
        else:
            checkpoint = torch.load(checkpoint_path, map_location=device)
            
            if 'fc.1.weight' in checkpoint:
                num_classes = checkpoint['fc.1.weight'].shape[0]
                model.fc = nn.Sequential(
                    nn.Dropout(p=0.6),
                    nn.Linear(512, num_classes)
                )
            else:
                model.fc = nn.Sequential(
                    nn.Dropout(p=0.6),
                    nn.Linear(512, 1)
                )
            
            model.load_state_dict(checkpoint, strict=False)
        
        model.to(device)
        model.eval()
        torch.set_grad_enabled(False)
        
        gradcam = GradCAM(nn_module=model, target_layers="layer4", postprocessing=lambda x: x)
        gradcampp = GradCAMpp(nn_module=model, target_layers="layer4", postprocessing=lambda x: x)

        current_model_name = model_name
        evaluation_cache = {}
        logger.info("✓ Model loaded successfully!")
        return True

    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.on_event("startup")
async def startup_event():
    success = load_model()
    if not success:
        logger.warning("Model failed to load at startup")

@app.get("/")
async def root():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "device": str(device),
        "current_model": current_model_name,
        "available_models": list(AVAILABLE_MODELS.keys()),
        "predictions_available": {k: os.path.exists(v) for k, v in PREDICTIONS_CSV_PATHS.items()}
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "model_not_loaded",
        "cuda_available": torch.cuda.is_available(),
        "device": str(device),
        "current_model": current_model_name,
        "predictions_files": {k: os.path.exists(v) for k, v in PREDICTIONS_CSV_PATHS.items()}
    }

@app.post("/switch_model")
async def switch_model(model_name: str = Form(...)):
    logger.info(f"Switching to model: {model_name}")
    
    model_mapping = {
        "base_model": "Base Model",
        "segmented_model": "Segmented Model",
        "background_model": "Background Model"
    }
    
    backend_model_name = model_mapping.get(model_name, model_name)
    
    if backend_model_name not in AVAILABLE_MODELS:
        raise HTTPException(status_code=400, detail=f"Unknown model: {model_name}")
    
    success = load_model(backend_model_name)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {model_name}")
    
    return {
        "status": "success", 
        "model_loaded": backend_model_name,
        "device": str(device)
    }

@app.post("/evaluate_model_csv")
async def evaluate_model_csv(model_name: str = Form("base_model")):
    csv_path = PREDICTIONS_CSV_PATHS.get(model_name)
    
    if not csv_path or not os.path.exists(csv_path):
        logger.error(f"CSV file not found: {csv_path}")
        raise HTTPException(status_code=404, detail=f"CSV file not found for model: {model_name}")

    try:
        df = pd.read_csv(csv_path)
        logger.info(f"✓ Loaded CSV: {csv_path} with {len(df)} rows")
        
        df.columns = df.columns.str.strip()
        
        overall_exam = df[(df['Group'] == 'Overall') & (df['Level'] == 'per_exam')]
        overall_image = df[(df['Group'] == 'Overall') & (df['Level'] == 'per_image')]
        
        if len(overall_exam) == 0 or len(overall_image) == 0:
            raise HTTPException(status_code=500, detail="Overall metrics not found in CSV")
        
        exam_row = overall_exam.iloc[0]
        image_row = overall_image.iloc[0]
        
        overall = {
            'exam': {
                'auc': float(exam_row['AUC']) if not pd.isna(exam_row['AUC']) else 0.0,
                'accuracy': float(exam_row['Accuracy']),
                'n_exams': int(exam_row['N_Exams']),
                'n_positive': int(exam_row['N_Positive']),
                'n_negative': int(exam_row['N_Negative']),
                'tp': int(exam_row['TP']),
                'tn': int(exam_row['TN']),
                'fp': int(exam_row['FP']),
                'fn': int(exam_row['FN']),
                'precision': float(exam_row['Precision']) if not pd.isna(exam_row['Precision']) else 0.0,
                'recall': float(exam_row['Recall']) if not pd.isna(exam_row['Recall']) else 0.0,
                'f1': float(exam_row['F1']) if not pd.isna(exam_row['F1']) else 0.0
            },
            'image': {
                'auc': float(image_row['AUC']) if not pd.isna(image_row['AUC']) else 0.0,
                'accuracy': float(image_row['Accuracy']),
                'n_images': int(image_row['N_Images']),
                'n_positive': int(image_row['N_Positive']),
                'n_negative': int(image_row['N_Negative']),
                'tp': int(image_row['TP']),
                'tn': int(image_row['TN']),
                'fp': int(image_row['FP']),
                'fn': int(image_row['FN']),
                'precision': float(image_row['Precision']) if not pd.isna(image_row['Precision']) else 0.0,
                'recall': float(image_row['Recall']) if not pd.isna(image_row['Recall']) else 0.0,
                'f1': float(image_row['F1']) if not pd.isna(image_row['F1']) else 0.0
            }
        }

        def extract_subgroup(subgroup_name):
            sub_exam = df[(df['Group'] == subgroup_name) & (df['Level'] == 'per_exam')]
            sub_image = df[(df['Group'] == subgroup_name) & (df['Level'] == 'per_image')]
            result = {}
            
            for _, row in sub_exam.iterrows():
                value_key = str(row['Value'])
                result[value_key] = {'exam': {}}
                result[value_key]['exam'] = {
                    'auc': float(row['AUC']) if not pd.isna(row['AUC']) else 0.0,
                    'accuracy': float(row['Accuracy']),
                    'n_exams': int(row['N_Exams']),
                    'n_positive': int(row['N_Positive']),
                    'n_negative': int(row['N_Negative']),
                    'tp': int(row['TP']),
                    'tn': int(row['TN']),
                    'fp': int(row['FP']),
                    'fn': int(row['FN']),
                    'precision': float(row['Precision']) if not pd.isna(row['Precision']) else 0.0,
                    'recall': float(row['Recall']) if not pd.isna(row['Recall']) else 0.0,
                    'f1': float(row['F1']) if not pd.isna(row['F1']) else 0.0
                }
            
            for _, row in sub_image.iterrows():
                value_key = str(row['Value'])
                if value_key not in result:
                    result[value_key] = {}
                result[value_key]['image'] = {
                    'auc': float(row['AUC']) if not pd.isna(row['AUC']) else 0.0,
                    'accuracy': float(row['Accuracy']),
                    'n_images': int(row['N_Images']),
                    'n_positive': int(row['N_Positive']),
                    'n_negative': int(row['N_Negative']),
                    'tp': int(row['TP']),
                    'tn': int(row['TN']),
                    'fp': int(row['FP']),
                    'fn': int(row['FN']),
                    'precision': float(row['Precision']) if not pd.isna(row['Precision']) else 0.0,
                    'recall': float(row['Recall']) if not pd.isna(row['Recall']) else 0.0,
                    'f1': float(row['F1']) if not pd.isna(row['F1']) else 0.0
                }
            
            return result

        response = {
            "overall": overall,
            "by_race": extract_subgroup("Race"),
            "by_age": extract_subgroup("Age"),
            "by_density": extract_subgroup("Breast Density"),
            "by_view": extract_subgroup("View"),
            "by_laterality": extract_subgroup("Laterality"),
            "by_vendor": extract_subgroup("Vendor"),
            "model_name": model_name
        }

        return response

    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None),
    visualization: Optional[str] = Form("None")
):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if model_name:
        model_mapping = {
            "base_model": "Base Model",
            "segmented_model": "Segmented Model",
            "background_model": "Background Model"
        }
        backend_model_name = model_mapping.get(model_name, model_name)
        
        if backend_model_name in AVAILABLE_MODELS and backend_model_name != current_model_name:
            load_model(backend_model_name)

    temp_file_path = None
    try:
        image_bytes = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name
        
        img_bgr = cv2.imread(temp_file_path, cv2.IMREAD_UNCHANGED)
        
        if img_bgr is None:
            raise ValueError("Failed to load image")
        
        x = minmax_normalize_image(img_bgr).unsqueeze(0).to(device)
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        model.eval()
        torch.set_grad_enabled(False)
        with torch.no_grad():
            outputs = model(x)
            probs = torch.sigmoid(outputs)
            prob = probs.item()
            pred_idx = 1 if prob >= 0.5 else 0
        
        true_label = "Cancer" if pred_idx == 1 else "Negative"

        response = {
            "prediction": int(pred_idx),
            "probability": float(prob),
            "label": true_label,
            "filename": file.filename,
            "model_used": current_model_name,
            "confidence": float(prob) if pred_idx == 1 else float(1 - prob),
            "visualization_method": visualization
        }
        
        if visualization in ["Grad-CAM", "Grad-CAM++"]:
            torch.set_grad_enabled(True)
            
            if visualization == "Grad-CAM" and gradcam is not None:
                cam_map = gradcam(x)
                overlay, mask, img_shape = show_cam_on_image(x[0], cam_map)
                
                h, w = img_shape[0], img_shape[1]
                fig_width = 8
                fig_height = (h / w) * fig_width
                
                fig = plt.figure(figsize=(fig_width, fig_height))
                fig.patch.set_alpha(0)
                
                ax = fig.add_axes([0, 0, 0.85, 1])
                ax.imshow(overlay)
                ax.axis("off")
                
                cbar_ax = fig.add_axes([0.87, 0.15, 0.03, 0.7])
                norm = Normalize(vmin=0, vmax=1)
                sm = ScalarMappable(cmap="jet", norm=norm)
                sm.set_array(mask)
                cbar = plt.colorbar(sm, cax=cbar_ax)
                cbar.set_label("Activation", rotation=270, labelpad=15, fontsize=10)
                
                buf = BytesIO()
                plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', pad_inches=0, transparent=True)
                plt.close(fig)
                buf.seek(0)
                
                img_str = base64.b64encode(buf.read()).decode()
                response["gradcam_image"] = f"data:image/png;base64,{img_str}"
                
            elif visualization == "Grad-CAM++" and gradcampp is not None:
                campp_map = gradcampp(x)
                overlay, mask, img_shape = show_cam_on_image(x[0], campp_map)
                
                h, w = img_shape[0], img_shape[1]
                fig_width = 8
                fig_height = (h / w) * fig_width
                
                fig = plt.figure(figsize=(fig_width, fig_height))
                fig.patch.set_alpha(0)
                
                ax = fig.add_axes([0, 0, 0.85, 1])
                ax.imshow(overlay)
                ax.axis("off")
                
                cbar_ax = fig.add_axes([0.87, 0.15, 0.03, 0.7])
                norm = Normalize(vmin=0, vmax=1)
                sm = ScalarMappable(cmap="jet", norm=norm)
                sm.set_array(mask)
                cbar = plt.colorbar(sm, cax=cbar_ax)
                cbar.set_label("Activation", rotation=270, labelpad=15, fontsize=10)
                
                buf = BytesIO()
                plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', pad_inches=0, transparent=True)
                plt.close(fig)
                buf.seek(0)
                
                img_str = base64.b64encode(buf.read()).decode()
                response["gradcampp_image"] = f"data:image/png;base64,{img_str}"
            
            torch.set_grad_enabled(False)
            
        return response

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)