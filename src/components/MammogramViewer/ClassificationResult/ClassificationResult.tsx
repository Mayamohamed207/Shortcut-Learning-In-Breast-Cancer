import React, { useEffect, useState } from 'react';
import { PredictionResult } from '../MammogramViewer';
import './ClassificationResult.css';

interface ClassificationResultProps {
  hasImage: boolean;
  predictionResult: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
}

const ClassificationResult: React.FC<ClassificationResultProps> = ({
  hasImage,
  predictionResult,
  isLoading,
  error
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (predictionResult) {
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [predictionResult]);

  return (
    <div className="classification-panel">
      <h3>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        Analysis Results
      </h3>

      {!hasImage ? (
        <div className="no-image-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>Upload an image to see classification results</p>
        </div>
      ) : isLoading ? (
        <div className="loading-container">
          <div className="wrapper">
            <div className="circle"></div>
            <div className="circle"></div>
            <div className="circle"></div>
            <div className="shadow"></div>
            <div className="shadow"></div>
            <div className="shadow"></div>
          </div>
          <p className="loading-text">Analyzing image...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Error: {error}</p>
        </div>
      ) : predictionResult ? (
        <>
          <div className="result-card-container">
            <div className={`result-card-trail ${animate ? 'active' : ''}`}>
              
              <div className="trail-step step2">
                <div
                  className="prediction-label"
                  style={{ 
                    color: predictionResult.prediction === 1 ? "#6DB18F" : "#E57A8C",
                    background: predictionResult.prediction === 1 
                      ? "linear-gradient(135deg, rgba(109, 177, 143, 0.15) 0%, rgba(109, 177, 143, 0.25) 100%)" 
                      : "linear-gradient(135deg, rgba(229, 122, 140, 0.15) 0%, rgba(229, 122, 140, 0.25) 100%)"
                  }}
                >
                  {predictionResult.label}
                </div>
              </div>
              
              <div className="trail-step step3">
                <div className="detail-card">
                  <div className="detail-item">
                    <span className="detail-label">Prediction Value</span>
                    <span className="detail-value">{predictionResult.prediction}</span>
                  </div>
                </div>
              </div>
              
              <div className="trail-step step4">
                <div className="explanation-card">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  <p>
                    {predictionResult.prediction === 1 
                      ? "The model has not detected signs of malignancy. This result indicates a negative classification."
                      : "The model has detected potential signs requiring further evaluation. This result indicates areas of concern."
                    }
                  </p>
                </div>
              </div>
               <div className="trail-step step5">
              <div className="info-note">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>
                 <strong>Important:</strong> A prediction value of <strong style={{color: predictionResult.prediction === 0 ? '#E57A8C' : '#6DB18F'}}>0</strong> indicates potential signs of malignancy detected by the model, while a value of <strong style={{color: predictionResult.prediction === 1 ? '#6DB18F' : '#E57A8C'}}>1</strong> indicates no signs detected (negative result).
                </p>
              </div>
            </div>

            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ClassificationResult;