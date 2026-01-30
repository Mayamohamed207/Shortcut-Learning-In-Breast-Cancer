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
from typing import Optional, List
from monai.visualize import GradCAM, GradCAMpp
import base64
from io import BytesIO
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib
from matplotlib.cm import ScalarMappable
from matplotlib.colors import Normalize
from sklearn.metrics import roc_auc_score, accuracy_score, confusion_matrix
import pandas as pd

matplotlib.use('Agg')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mammogram Prediction API")

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
current_model_name = "Base Model"

AVAILABLE_MODELS = {
    "Base Model": "./models/all-exams-weighted-sampling-constant-interpolation-pytorch-default-v1/base_model_epoch_4.pth",
    "Segmented Model": "./models/all-exams-weighted-sampling-constant-interpolation-pytorch-default-v1/segmented_model_epoch_4.pth",
    "Background Model": "./models/all-exams-weighted-sampling-constant-interpolation-pytorch-default-v1/background_model_epoch_3.pth"
}

PARQUET_PATHS = {
    "base_model": r"C:\Users\MO\shortcut-breast-cancer-playground\backend\predictions_subgroups\parquet\base_model_embeddings.parquet",
    "segmented_model": r"C:\Users\MO\shortcut-breast-cancer-playground\backend\predictions_subgroups\parquet\segmented_model_embeddings.parquet",
    "background_model": r"C:\Users\MO\shortcut-breast-cancer-playground\backend\predictions_subgroups\parquet\background_model_embeddings.parquet",
}

def calculate_metrics(y_true, y_prob):
    # Ensure standard python types for JSON serialization
    y_pred = (y_prob >= 0.5).astype(int)
    auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    
    return {
        'auc': auc,
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'tp': int(tp),
        'tn': int(tn),
        'fp': int(fp),
        'fn': int(fn),
        'n_positive': int(sum(y_true)),
        'n_negative': int(len(y_true) - sum(y_true))
    }

def minmax_normalize_image(img):
    img_float = np.array(img).astype(np.float32)
    min_val, max_val = img_float.min(), img_float.max()
    range_val = max_val - min_val
    if range_val == 0:
        return torch.zeros((3, 224, 224))
    normalized = (img_float - min_val) / range_val
    return torch.from_numpy(normalized).permute(2, 0, 1)

def show_cam_on_image(image, mask, alpha=0.5):
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
    global model, current_model_name, gradcam, gradcampp
    try:
        checkpoint_path = AVAILABLE_MODELS.get(model_name, AVAILABLE_MODELS["Base Model"])
        logger.info(f"Loading checkpoint: {checkpoint_path}")
        
        torch.manual_seed(42)
        model = resnet18(pretrained=False)
        
        if not os.path.exists(checkpoint_path):
            logger.warning(f"Model checkpoint not found at {checkpoint_path}")
            model.fc = nn.Sequential(nn.Dropout(p=0.6), nn.Linear(512, 1))
        else:
            checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
            # Support different FC layer naming conventions
            fc_key = 'fc.1.weight' if 'fc.1.weight' in checkpoint else 'fc.weight'
            num_classes = checkpoint[fc_key].shape[0]
            model.fc = nn.Sequential(nn.Dropout(p=0.6), nn.Linear(512, num_classes))
            model.load_state_dict(checkpoint, strict=False)
        
        model.to(device)
        model.eval()
        gradcam = GradCAM(nn_module=model, target_layers="layer4")
        gradcampp = GradCAMpp(nn_module=model, target_layers="layer4")
        current_model_name = model_name
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        return False

# --- DYNAMIC N-VARIABLE INTERSECTIONAL LOGIC ---
def calculate_intersectional_metrics(df, column_names: List[str], aggregation='per_exam'):
    df_clean = df.copy()
    for col in column_names:
        if col not in df_clean.columns:
            logger.error(f"Column {col} missing in dataframe.")
            return []
        df_clean[col] = df_clean[col].fillna("Unknown").astype(str)

    results = []
    # Group by the list of columns (supports 1, 2, 3 or more)
    grouped = df_clean.groupby(column_names)
    
    for group_values, df_sub in grouped:
        if len(df_sub) == 0:
            continue

        # groupby return value is a tuple if multiple columns, or a single value if one
        if not isinstance(group_values, (tuple, list)):
            vals = [group_values]
        else:
            vals = list(group_values)

        if aggregation == 'per_exam':
            exam_groups = df_sub.groupby('exam_id').agg({
                'pred_prob': 'max',
                'true_label': 'first'
            }).reset_index()
            y_true = exam_groups['true_label'].values
            y_prob = exam_groups['pred_prob'].values
        else:
            y_true = df_sub['true_label'].values
            y_prob = df_sub['pred_prob'].values

        m = calculate_metrics(y_true, y_prob)
        
        # Build response row with metadata
        row_res = {
            "auc": m['auc'],
            "accuracy": m['accuracy'],
            "tp": m['tp'],
            "tn": m['tn'],
            "fp": m['fp'],
            "fn": m['fn'],
            "n_positive": m['n_positive'],
            "n_negative": m['n_negative']
        }
        
        # Map values back to their specific column names
        for i, col in enumerate(column_names):
            row_res[col] = str(vals[i])
            
        results.append(row_res)

    return results

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
async def root():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "current_model": current_model_name,
        "parquet_available": {k: os.path.exists(v) for k, v in PARQUET_PATHS.items()}
    }

@app.post("/switch_model")
async def switch_model(model_name: str = Form(...)):
    model_mapping = {"base_model": "Base Model", "segmented_model": "Segmented Model", "background_model": "Background Model"}
    target = model_mapping.get(model_name, model_name)
    if load_model(target):
        return {"status": "success", "model_loaded": target}
    raise HTTPException(status_code=500, detail="Failed to load model")

@app.post("/evaluate_model_csv")
async def evaluate_model_parquet(model_name: str = Form("base_model")):
    parquet_path = PARQUET_PATHS.get(model_name)
    model_key = {"base_model": "Base Model", "segmented_model": "Segmented Model", "background_model": "Background Model"}.get(model_name, "Base Model")
    checkpoint_path = AVAILABLE_MODELS.get(model_key)

    if not parquet_path or not os.path.exists(parquet_path):
        raise HTTPException(status_code=404, detail="Parquet not found")

    try:
        df = pd.read_parquet(parquet_path)
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
        
        fc_w_key = 'fc.1.weight' if 'fc.1.weight' in checkpoint else 'fc.weight'
        fc_b_key = 'fc.1.bias' if 'fc.1.bias' in checkpoint else 'fc.bias'
        
        weight = checkpoint[fc_w_key].cpu().numpy()
        bias = checkpoint[fc_b_key].cpu().numpy()
        
        embeddings = np.stack(df['embedding'].values)
        logits = np.dot(embeddings, weight.T) + bias
        df['pred_prob'] = 1 / (1 + np.exp(-logits.flatten()))
        
        def get_subgroups(group_col):
            if group_col not in df.columns: return {}
            sub_results = {}
            for val in df[group_col].unique():
                sub_df = df[df[group_col] == val]
                exam_df = sub_df.groupby('exam_id').agg({'pred_prob': 'max', 'true_label': 'first'})
                sub_results[str(val)] = {
                    "exam": calculate_metrics(exam_df['true_label'].values, exam_df['pred_prob'].values),
                    "image": calculate_metrics(sub_df['true_label'].values, sub_df['pred_prob'].values)
                }
            return sub_results

        df_overall_exam = df.groupby('exam_id').agg({'pred_prob': 'max', 'true_label': 'first'})
        
        return {
            "overall": {
                "exam": calculate_metrics(df_overall_exam['true_label'].values, df_overall_exam['pred_prob'].values),
                "image": calculate_metrics(df['true_label'].values, df['pred_prob'].values)
            },
            "by_race": get_subgroups('race'),
            "by_age": get_subgroups('age_binned'),
            "by_density": get_subgroups('tissueden'),
            "by_view": get_subgroups('0_ViewCodeSequence_CodeMeaning'),
            "by_laterality": get_subgroups('ImageLateralityFinal'),
            "by_vendor": get_subgroups('Manufacturer')
        }
    except Exception as e:
        logger.error(f"Evaluation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate_intersection")
async def evaluate_intersection(
    model_name: str = Form("base_model"),
    columns: str = Form("race,tissueden"),  # Frontend should send comma-separated list
    view_mode: str = Form("exam")
):
    parquet_path = PARQUET_PATHS.get(model_name)
    model_key = {"base_model": "Base Model", "segmented_model": "Segmented Model", "background_model": "Background Model"}.get(model_name, "Base Model")
    checkpoint_path = AVAILABLE_MODELS.get(model_key)

    if not os.path.exists(parquet_path):
        raise HTTPException(status_code=404, detail="Parquet file not found")

    try:
        df = pd.read_parquet(parquet_path)
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
        
        fc_w_key = 'fc.1.weight' if 'fc.1.weight' in checkpoint else 'fc.weight'
        fc_b_key = 'fc.1.bias' if 'fc.1.bias' in checkpoint else 'fc.bias'
        
        weight = checkpoint[fc_w_key].cpu().numpy()
        bias = checkpoint[fc_b_key].cpu().numpy()
        
        embeddings = np.stack(df['embedding'].values)
        logits = np.dot(embeddings, weight.T) + bias
        df['pred_prob'] = 1 / (1 + np.exp(-logits.flatten()))

        # Split comma-separated string into list
        col_list = [c.strip() for c in columns.split(',') if c.strip()]
        agg_type = 'per_exam' if view_mode == 'exam' else 'per_image'
        
        data = calculate_intersectional_metrics(df, col_list, aggregation=agg_type)

        return {
            "model": model_name,
            "columns": col_list,
            "data": data
        }
    except Exception as e:
        logger.error(f"Intersectional Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None),
    visualization: Optional[str] = Form("None")
):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    temp_file_path = None
    try:
        image_bytes = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name
        
        img_bgr = cv2.imread(temp_file_path, cv2.IMREAD_UNCHANGED)
        x = minmax_normalize_image(img_bgr).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(x)
            prob = torch.sigmoid(outputs).item()
            pred_idx = 1 if prob >= 0.5 else 0
        
        response = {
            "prediction": int(pred_idx),
            "probability": float(prob),
            "label": "Cancer" if pred_idx == 1 else "Negative",
            "model_used": current_model_name
        }
        
        if visualization in ["Grad-CAM", "Grad-CAM++"]:
            torch.set_grad_enabled(True)
            target_cam = gradcam if visualization == "Grad-CAM" else gradcampp
            if target_cam:
                cam_map = target_cam(x)
                overlay, _, _ = show_cam_on_image(x[0], cam_map)
                plt.figure(figsize=(8, 8))
                plt.imshow(overlay)
                plt.axis("off")
                buf = BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
                plt.close()
                buf.seek(0)
                img_key = "gradcam_image" if visualization == "Grad-CAM" else "gradcampp_image"
                response[img_key] = f"data:image/png;base64,{base64.b64encode(buf.read()).decode()}"
            torch.set_grad_enabled(False)
            
        return response
    except Exception as e:
        logger.error(f"Predict error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)