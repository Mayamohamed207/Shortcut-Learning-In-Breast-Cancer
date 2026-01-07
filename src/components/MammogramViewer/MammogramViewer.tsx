import React, { useState, useRef } from 'react';
import './MammogramViewer.css';
import ImageUploader from './ImageUploader/ImageUploader';
import ImageDisplay from './ImageDisplay/ImageDisplay';
import ClassificationResult from './ClassificationResult/ClassificationResult';

export interface PredictionResult {
  prediction: number;
  probability: number;
  label: string;
  filename: string;
  model_used?: string;
  confidence: number;
  visualization_method?: string;
  gradcam_image?: string;
  gradcampp_image?: string;
}

const MammogramViewer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("base_model");
  const [selectedVisualization, setSelectedVisualization] = useState<string>("None");
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [cachedGradCAM, setCachedGradCAM] = useState<string | null>(null);
  const [cachedGradCAMpp, setCachedGradCAMpp] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const runPrediction = async (file: File, model: string, visualization: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_name', model);
      formData.append('visualization', visualization);

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Prediction failed');
      }

      const result: PredictionResult = await response.json();
      setPredictionResult(result);

      if (result.gradcam_image) {
        setCachedGradCAM(result.gradcam_image);
      }
      if (result.gradcampp_image) {
        setCachedGradCAMpp(result.gradcampp_image);
      }

      console.log('Prediction result:', result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get prediction';
      setError(errorMessage);
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setError(null);
    setPredictionResult(null);
    setCachedGradCAM(null);
    setCachedGradCAMpp(null);

    setUploadedFile(file);
    setImageUrl(URL.createObjectURL(file));
    
    await runPrediction(file, selectedModel, "None");
  };

  const handleUploadNew = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setUploadedFile(null);
    setImageUrl(null);
    setPredictionResult(null);
    setError(null);
    setShowOriginal(false);
    setCachedGradCAM(null);
    setCachedGradCAMpp(null);
  };

  const handleDoubleClick = () => {
    if (imageUrl && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setCachedGradCAM(null);
    setCachedGradCAMpp(null);
    
    if (uploadedFile) {
      console.log(`Switching to model: ${newModel}`);
      await runPrediction(uploadedFile, newModel, "None");
    }
  };

  const handleVisualizationChange = async (newViz: string) => {
    setSelectedVisualization(newViz);
    
    if (newViz === "None") {
      console.log(`Switched to: None`);
      return;
    }
    
    if (uploadedFile) {
      const needsGeneration = 
        (newViz === "Grad-CAM" && !cachedGradCAM) ||
        (newViz === "Grad-CAM++" && !cachedGradCAMpp);
      
      if (needsGeneration) {
        console.log(`Generating ${newViz}...`);
        await runPrediction(uploadedFile, selectedModel, newViz);
      } else {
        console.log(`Using cached ${newViz}`);
      }
    }
  };

  const getDisplayImage = () => {
    if (showOriginal) {
      return imageUrl;
    }
    
    if (selectedVisualization === "Grad-CAM" && cachedGradCAM) {
      return cachedGradCAM;
    }
    if (selectedVisualization === "Grad-CAM++" && cachedGradCAMpp) {
      return cachedGradCAMpp;
    }
    
    return imageUrl;
  };

  return (
    <div className="mammogram-viewer">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <div className="viewer-layout">
        <aside className="viewer-sidebar">
          <div className="control-group">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Model Configuration
            </h3>
            <div className="form-group">
              <label>Choose Model</label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
              >
                <option value="base_model">Base Model (Epoch 4)</option>
                <option value="segmented_model">Segmented Model (Epoch 12)</option>
                <option value="background_model">Background Model (Epoch 7)</option>
              </select>
            </div>
          </div>

          <div className="control-group">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Visualization Options
            </h3>
            <div className="form-group">
              <label>Visualization Method</label>
              <select
                value={selectedVisualization}
                onChange={(e) => handleVisualizationChange(e.target.value)}
              >
                <option value="None">None</option>
                <option value="Grad-CAM">Grad-CAM</option>
                <option value="Grad-CAM++">Grad-CAM++</option>
              </select>
            </div>
          </div>

          <div className="control-group">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Image Controls
            </h3>
            <div className="form-group">
              <div className="checkbox-group">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="show-overlay"
                    checked={showOriginal}
                    onChange={(e) => setShowOriginal(e.target.checked)}
                    disabled={selectedVisualization === "None"}
                  />
                  <label htmlFor="show-overlay">
                    {selectedVisualization !== "None" ? "Show Original Image" : "No visualization active"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="viewer-center" onDoubleClick={handleDoubleClick}>
          {!imageUrl ? (
            <ImageUploader onFileUpload={handleFileUpload} />
          ) : (
            <>
              {selectedVisualization !== "None" && !showOriginal &&
               (cachedGradCAM || cachedGradCAMpp) && (
                <div style={{
                  position: 'absolute',
                  top: 'var(--space-4)',
                  left: 'var(--space-4)',
                  background: 'var(--color-success)',
                  color: 'white',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85em',
                  fontWeight: '600',
                  zIndex: 10,
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {selectedVisualization} Active
                </div>
              )}
              <ImageDisplay 
                imageUrl={getDisplayImage() || imageUrl}
                fileName={uploadedFile?.name || ''}
                onUploadNew={handleUploadNew}
              />
            </>
          )}
        </div>

        <div className="viewer-results">
          <ClassificationResult 
            hasImage={!!imageUrl}
            predictionResult={predictionResult}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default MammogramViewer;