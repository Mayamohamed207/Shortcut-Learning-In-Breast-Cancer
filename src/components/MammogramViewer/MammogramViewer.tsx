import React, { useState, useRef } from 'react';
import './MammogramViewer.css';
import ImageUploader from './ImageUploader/ImageUploader';
import ImageDisplay from './ImageDisplay/ImageDisplay';
import ClassificationResult from './ClassificationResult/ClassificationResult';

export interface PredictionResult {
  prediction: number; 
  label: string;
  filename: string;
  model_used: string;
}

const MammogramViewer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("image_only");
  const [selectedVisualization, setSelectedVisualization] = useState<string>("None");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setError(null);
    setPredictionResult(null);

    setUploadedFile(file);
    setImageUrl(URL.createObjectURL(file));
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_name', selectedModel);

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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get prediction';
      setError(errorMessage);
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadNew = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setUploadedFile(null);
    setImageUrl(null);
    setPredictionResult(null);
    setError(null);
  };

  const handleDoubleClick = () => {
    if (imageUrl && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
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
        {/* Left Sidebar - Controls */}
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
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="image_only">Image Only Model</option>
                <option value="segmented_model">Segmented Model</option>
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
                onChange={(e) => setSelectedVisualization(e.target.value)}
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
                    defaultChecked={false}
                  />
                  <label htmlFor="show-overlay">Hide Visualization Overlay</label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Image Display */}
        <div className="viewer-center" onDoubleClick={handleDoubleClick}>
          {!imageUrl ? (
            <ImageUploader onFileUpload={handleFileUpload} />
          ) : (
            <ImageDisplay 
              imageUrl={imageUrl}
              fileName={uploadedFile?.name || ''}
              onUploadNew={handleUploadNew}
            />
          )}
        </div>

        {/* Right - Classification Results */}
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