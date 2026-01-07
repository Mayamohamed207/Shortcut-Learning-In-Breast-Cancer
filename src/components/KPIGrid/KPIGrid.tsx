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
  precision: number;
  recall: number;
  f1: number;
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

  const totalSamples = viewMode === 'exam' ? (overall.n_exams || 0) : (overall.n_images || 0);

  return (
    <div className="kpi-section">
      <div className="kpi-header">
        <h2>Overall Performance - {viewMode === 'exam' ? 'Per Exam' : 'Per Image'}</h2>
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
            <div className="kpi-badge">ROC</div>
          </div>
          <div className="kpi-value">{(overall.auc * 100).toFixed(1)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${overall.auc * 100}%`, backgroundColor: '#7A3F6D' }}></div>
          </div>
          <div className="kpi-subtitle">Area Under Curve</div>
        </div>

        <div className="kpi-card accuracy-card">
          <div className="kpi-header-row">
            <div className="kpi-label">Accuracy</div>
            <div className="kpi-badge">ACC</div>
          </div>
          <div className="kpi-value">{(overall.accuracy * 100).toFixed(1)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${overall.accuracy * 100}%`, backgroundColor: '#d9829b' }}></div>
          </div>
          <div className="kpi-subtitle">Overall Correctness</div>
        </div>

        {/* <div className="kpi-card precision-card">
          <div className="kpi-header-row">
            <div className="kpi-label">Precision</div>
            <div className="kpi-badge">PPV</div>
          </div>
          <div className="kpi-value">{(overall.precision * 100).toFixed(1)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${overall.precision * 100}%`, backgroundColor: '#3B8AC4' }}></div>
          </div>
          <div className="kpi-subtitle">Positive Predictive Value</div>
        </div> */}

        <div className="kpi-card recall-card">
          <div className="kpi-header-row">
            <div className="kpi-label">Recall</div>
            <div className="kpi-badge">TPR</div>
          </div>
          <div className="kpi-value">{(overall.recall * 100).toFixed(1)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${overall.recall * 100}%`, backgroundColor: '#D4A04D' }}></div>
          </div>
          <div className="kpi-subtitle">Sensitivity</div>
        </div>

        {/* <div className="kpi-card f1-card">
          <div className="kpi-header-row">
            <div className="kpi-label">F1 Score</div>
            <div className="kpi-badge">F1</div>
          </div>
          <div className="kpi-value">{(overall.f1 * 100).toFixed(1)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${overall.f1 * 100}%`, backgroundColor: '#D63E68' }}></div>
          </div>
          <div className="kpi-subtitle">Harmonic Mean</div>
        </div> */}

        <div className="kpi-card prevalence-card">
          <div className="kpi-header-row">
            <div className="kpi-label">Cancer Rate</div>
            <div className="kpi-badge">PREV</div>
          </div>
          <div className="kpi-value">{((overall.n_positive / totalSamples) * 100).toFixed(1)}%</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${(overall.n_positive / totalSamples) * 100}%`, backgroundColor: '#46351D' }}></div>
          </div>
          <div className="kpi-subtitle">Positive Cases Ratio</div>
        </div>
      </div>
    </div>
  );
};

export default KPIGrid;