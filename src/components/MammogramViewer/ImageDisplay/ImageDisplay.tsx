import React from 'react';
import './ImageDisplay.css';

interface ImageDisplayProps {
  imageUrl: string;
  fileName: string;
  onUploadNew: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageUrl, 
  fileName,
  onUploadNew 
}) => {

  return (
    <div className="image-display">
      <div className="image-header">
        <div className="header-left">
          <h3>Mammogram Image</h3>
          <span className="file-name">{fileName}</span>
        </div>
        <button className="btn btn-secondary btn-upload-new" onClick={onUploadNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload New
        </button>
      </div>
      
      <div className="image-container">
        <img src={imageUrl} alt="Mammogram" className="mammogram-image" />
      </div>
    </div>
  );
};

export default ImageDisplay;