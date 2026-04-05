<div align="center">

# 🩺 Shortcut in Breast Cancer
### *AI Playground — Graduation Project*

> *An interactive web platform for detecting shortcut learning and bias in breast cancer risk prediction models — built for researchers.*

[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![HAX Compliant](https://img.shields.io/badge/Microsoft%20HAX-Compliant-0078D4?style=for-the-badge)](https://www.microsoft.com/en-us/haxtoolkit/)
[![Privacy First](https://img.shields.io/badge/Privacy-No%20Raw%20Images%20Stored-green?style=for-the-badge)]()

</div>

---

## The Problem

State-of-the-art breast cancer AI models are often evaluated on a single accuracy number — but that number hides a critical question: **is the model actually learning clinically meaningful signals, or is it relying on spurious shortcuts?**

Shortcuts can include background annotations, radiographic markers, race-correlated features, or artifacts that have nothing to do with actual cancer risk. When deployed in clinical settings, these models fail silently — and dangerously.

**Our platform makes those hidden shortcuts visible.**

---

## What We Built

The **AI Playground** is a web-based research and clinical support tool that lets researchers and clinicians explore, compare, and interpret AI model behavior interactively — not just look at a static accuracy number.

You can swap models, change datasets, filter by population subgroups, perform intersectional analysis, and see how the AUC shifts in real time. You can upload a mammogram and watch the model's reasoning visualized through GradCAM heatmaps — revealing exactly where the model is "looking."

The system follows **Microsoft HAX (Human-AI Interaction) Guidelines** — all AI outputs are transparent, confidence levels are always shown, and reasoning is explainable.

---

## Screenshots

### Main Analysis Dashboard
![Main Dashboard](src/assets/images/main%20dashboard%20playground.png)
*The core playground — swap models and datasets, adjust prediction level, and all metrics refresh instantly.*

---

### Subgroup & Intersectional Analysis
![Intersectional Analysis](src/assets/images/intersectional%20analysis%20and%20subgroup%20analysis.png)

Filter by any combination of **Race, Age, Breast Density, Vendor, View, and Laterality** to surface performance gaps across population subgroups.

---

### Model Comparison (Overall + Subgroups)

#### 🔹 Overall Performance & Confusion Matrix
![Overall Model Comparison](src/assets/images/model%20comparison%20with%20confusion%20matirix%20and%20all.png)

#### 🔹 Subgroup Analysis
![Subgroup Comparison](src/assets/images/model%20comparison%20subgroups.png)

Side-by-side comparison of all three models across datasets, including overall metrics and subgroup-level analysis. This helps evaluate generalization, robustness, and potential bias.

---
---

### Mammogram Viewer
![Mammogram Viewer](src/assets/images/mammogram%20viewer.png)

Upload a mammogram and select a model. The system runs inference and returns a Cancer / Negative prediction.

---

### 🔴 Cancer Prediction with GradCAM
![Cancer with GradCAM](src/assets/images/mammogram%20viewer%20cancer%20with%20gradcam.png)

When GradCAM or GradCAM++ is enabled, a heatmap overlays the mammogram showing exactly which regions influenced the model's decision. If the model focused on breast tissue → trustworthy signal. If it focused on markers, pectoral muscle, or background → shortcut learning detected.

---

### 🟢 Negative Prediction
![Negative Prediction](src/assets/images/mammogram%20viewer%20negative.png)

Negative predictions are displayed with the same transparency and toggle to show or hide the gradcam visualization overlay.

---

## Core Features

### Interactive Model Exploration
| What You Can Change | What Updates Instantly |
|---|---|
| Model (Original / Segmented / Background Only) | AUC, Confusion Matrix, N+/N-, all subgroup tables |
| Prediction Level (Per Exam / Per Image) | N counts, AUC, all metrics |
| Subgroup visibility (toggle on/off) | Subgroup table appears or hides |
| Intersectional filters (e.g. White + MLO + Age≥50) | Combined AUC + TP/TN/FP/FN or NaN if insufficient data |

### Three Dataset Modes
- **Original** — full mammogram image
- **Segmented** — breast tissue only (background removed)
- **Background Only** — breast removed, artifacts only

Comparing model performance across these three modes directly reveals whether a model is learning from the breast tissue or from surrounding artifacts.

### GradCAM Visualization
- Toggle **GradCAM** or **GradCAM++** on any uploaded mammogram
- Heatmap overlay highlights the regions driving the model's prediction
  
### Privacy by Design
- Raw mammogram images are **never uploaded or stored**
- Backend uses **Parquet files** with pre-extracted embeddings — compact, fast, and patient-safe

---

## Actors & Use Cases

| Actor | What They Can Do |
|---|---|
| **Researcher** | Select models & datasets, explore subgroup/intersectional AUC, compare models side by side, identify bias and shortcut behavior |
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| backend | fastApi + our Ai codes |
| Data Storage | Parquet files (pre-extracted embeddings) |
| Visualization | GradCAM / GradCAM++ heatmap overlays |
| AI Guidelines | Microsoft HAX (Human-AI Interaction) |
| Deployment | Vite |

---

<div align="center">

*Transparency in AI is not optional — especially when it comes to human lives.*

</div>
