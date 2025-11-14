import React from 'react';
import ROCChart from '../Charts/ROCChart';
import PRChart from '../Charts/PRChart';

const ModelPerformance: React.FC = () => {
  return (
    <div className="panel">
      <h3>Model Performance Dashboard</h3>
      
      <div className="chart-grid-2">
        <div className="chart-container">
          <h4>ROC Curve Analysis</h4>
          <ROCChart />
        </div>
        
        <div className="chart-container">
          <h4>Precision-Recall Curve</h4>
          <PRChart />
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;