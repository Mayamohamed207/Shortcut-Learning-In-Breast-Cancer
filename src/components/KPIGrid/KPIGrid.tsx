import React from 'react';
import './KPIGrid.css';

interface PerformanceMetrics {
  auc: number;
  accuracy: number;
  n_exams?: number;
  n_images?: number;
  n_positive: number;
  n_negative: number;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}

interface KPIGridProps {
  overall: PerformanceMetrics | undefined;
  loading: boolean;
  viewMode: 'exam' | 'image';
}

const KPIGrid: React.FC<KPIGridProps> = ({ overall, loading, viewMode }) => {
  if (loading) {
    return (
      <div className="kpi-section">
        <div className="kpi-loading">
          <div className="spinner"></div>
          <p>Loading model performance...</p>
        </div>
      </div>
    );
  }

  if (!overall) return null;

  const rawTotal = viewMode === 'exam' ? (overall.n_exams || 0) : (overall.n_images || 0);
  const totalSamples = rawTotal > 0 ? rawTotal : (overall.n_positive + overall.n_negative);
  
  const cancerRatePercent = totalSamples > 0 
    ? ((overall.n_positive / totalSamples) * 100).toFixed(2) 
    : "0.0";

  return (
    <div className="kpi-section">
      <div className="kpi-header">
        <h2>Performance - {viewMode === 'exam' ? 'Per Exam' : 'Per Image'}</h2>
        <div className="kpi-badges">
          <span className="badge badge-samples">{totalSamples} Total {viewMode === 'exam' ? 'Exams' : 'Images'}</span>
          <span className="badge badge-positive">{overall.n_positive} Cancer</span>
          <span className="badge badge-negative">{overall.n_negative} Negative</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card auc-card">
          <div className="kpi-header-row">
            <div className="kpi-label">AUC Score</div>
          </div>
          <div className="kpi-value">{(overall.auc * 100).toFixed(2)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${overall.auc * 100}%`, backgroundColor: '#7A3F6D' }}></div>
          </div>
          <div className="kpi-subtitle">Area Under Curve</div>
        </div>

        <div className="kpi-card prevalence-card">
          <div className="kpi-header-row">
            <div className="kpi-label">Cancer Rate</div>
          </div>
          <div className="kpi-value">{cancerRatePercent}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${cancerRatePercent}%`, backgroundColor: '#46351D' }}></div>
          </div>
          <div className="kpi-subtitle">Positive Cases Ratio</div>
        </div>
      </div>
    </div>
  );
};

export default KPIGrid;