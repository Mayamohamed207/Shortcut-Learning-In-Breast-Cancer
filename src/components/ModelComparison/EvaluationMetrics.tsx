import React from 'react';

const EvaluationMetrics: React.FC = () => {
  return (
    <div className="panel">
      <h3>Model Evaluation Metrics</h3>
      
      <div className="chart-grid-3">
        <div className="chart-container">
          <h4>Confusion Matrix</h4>
          <div className="chart-placeholder">
            <p>Confusion matrix visualization</p>
          </div>
        </div>
        
        <div className="chart-container">
          <h4>Calibration Plot</h4>
          <div className="chart-placeholder">
            <p>Calibration plot</p>
          </div>
        </div>
        
        <div className="chart-container">
          <h4>Learning Curve</h4>
          <div className="chart-placeholder">
            <p>Learning curve</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationMetrics;