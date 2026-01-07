import React, { useState, useEffect } from 'react';
import './AnalysisDashboard.css';
import { ConfigState } from '../../App';
import KPIGrid from '../KPIGrid/KPIGrid';

const API_URL = 'http://localhost:8000';
const BRAND_COLORS = ['#d9829b', '#7A3F6D', '#3B8AC4', '#D4A04D', '#D63E68', '#46351D'];

interface AnalysisDashboardProps {
  config: ConfigState;
  viewMode: 'exam' | 'image';
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ config, viewMode }) => {
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);

  useEffect(() => { loadModelPerformance(); }, [config.modelArchitecture]);

  const loadModelPerformance = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('model_name', config.modelArchitecture);
      const response = await fetch(`${API_URL}/evaluate_model_csv`, { method: 'POST', body: formData });
      const data = await response.json();
      setEvaluationData(data);
    } catch (e) { console.error("API Error", e); }
    finally { setLoading(false); }
  };

  if (loading || !evaluationData) return <div className="loading">Updating Analytics...</div>;

  const currentData = evaluationData.overall[viewMode];
  const examData = evaluationData.overall.exam;
  const imageData = evaluationData.overall.image;
  const baselineAuc = currentData.auc;

  const getFocusValue = (sectionId: string) => {
    if (sectionId === 'view') {
        if (config.viewFocus === 'MLO') return 'medio-lateral oblique';
        if (config.viewFocus === 'CC') return 'cranio-caudal';
    }
    if (sectionId === 'density') {
        if (config.trainingDataset === 'All') return 'All';
        return `${parseFloat(config.trainingDataset).toFixed(1)}`;
    }
    if (sectionId === 'race') return config.racialGroup;
    if (sectionId === 'vendor') {
        if (config.vendorFocus === 'Hologic') return 'HOLOGIC, Inc.';
        if (config.vendorFocus === 'GE') return 'GE MEDICAL SYSTEMS';
    }
    if (sectionId === 'laterality') return config.lateralityFocus;
    if (sectionId === 'age') {
        if (config.populationFilter === 'All Patients') return 'All';
        return config.populationFilter;
    }
    return 'All';
  };

  const sections = [
    { id: 'race', title: 'Race / Ethnicity Analysis', dataKey: 'by_race' },
    { id: 'density', title: 'Breast Density Analysis', dataKey: 'by_density' },
    { id: 'vendor', title: 'Hardware Vendor Reliability', dataKey: 'by_vendor' },
    { id: 'view', title: 'View Position Analysis', dataKey: 'by_view' },
    { id: 'laterality', title: 'Laterality Performance', dataKey: 'by_laterality' },
    { id: 'age', title: 'Age Group Analysis', dataKey: 'by_age' },
  ];

  const examTotal = examData.n_positive + examData.n_negative;
  const examCancerPct = (examData.n_positive / examTotal) * 100;
  const examNegativePct = (examData.n_negative / examTotal) * 100;

  const imageTotal = imageData.n_positive + imageData.n_negative;
  const imageCancerPct = (imageData.n_positive / imageTotal) * 100;
  const imageNegativePct = (imageData.n_negative / imageTotal) * 100;

  const correctCancer = currentData.tp;
  const correctNegative = currentData.tn;
  const incorrectCancer = currentData.fn;
  const incorrectNegative = currentData.fp;

  const totalCorrect = correctCancer + correctNegative;
  const totalIncorrect = incorrectCancer + incorrectNegative;
  const totalAll = totalCorrect + totalIncorrect;

  const createPieSlices = (cancerPct: number, negativePct: number) => {
    const cancerAngle = (cancerPct / 100) * 360;
    const negativeAngle = (negativePct / 100) * 360;
    
    const cancerPath = describeArc(100, 100, 70, 0, cancerAngle);
    const negativePath = describeArc(100, 100, 70, cancerAngle, cancerAngle + negativeAngle);
    
    return { cancerPath, negativePath };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const examSlices = createPieSlices(examCancerPct, examNegativePct);
  const imageSlices = createPieSlices(imageCancerPct, imageNegativePct);

  return (
    <div className="analysis-dashboard">
      <KPIGrid overall={currentData} loading={loading} viewMode={viewMode} />
      
      <div className="confusion-matrix-section">
        <h3>Classification Results</h3>
        <div className="matrix-grid">
          <div className="matrix-card tp">
            <div className="matrix-label">True Positive</div>
            <div className="matrix-value">{currentData.tp}</div>
            <div className="matrix-desc">Correctly identified cancer</div>
          </div>
          <div className="matrix-card tn">
            <div className="matrix-label">True Negative</div>
            <div className="matrix-value">{currentData.tn}</div>
            <div className="matrix-desc">Correctly identified negative</div>
          </div>
          <div className="matrix-card fp">
            <div className="matrix-label">False Positive</div>
            <div className="matrix-value">{currentData.fp}</div>
            <div className="matrix-desc">Incorrectly flagged as cancer</div>
          </div>
          <div className="matrix-card fn">
            <div className="matrix-label">False Negative</div>
            <div className="matrix-value">{currentData.fn}</div>
            <div className="matrix-desc">Missed cancer cases</div>
          </div>
        </div>
      </div>

      <div className="distribution-section">
        <h3>Data Distribution & Accuracy</h3>
        <div className="dist-charts">
          <div className="dist-card">
            <h4>Exam Distribution</h4>
            <svg viewBox="0 0 200 200" className="pie-chart">
              <path d={examSlices.cancerPath} fill="#d9829b" />
              <path d={examSlices.negativePath} fill="#3B8AC4" />
              <circle cx="100" cy="100" r="45" fill="white" />
              <text x="100" y="95" textAnchor="middle" className="pie-center-text">{examTotal}</text>
              <text x="100" y="110" textAnchor="middle" className="pie-center-label">Exams</text>
            </svg>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#d9829b'}}></span>
                <span>Cancer: {examData.n_positive} ({examCancerPct.toFixed(1)}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#3B8AC4'}}></span>
                <span>Negative: {examData.n_negative} ({examNegativePct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          <div className="dist-card">
            <h4>Image Distribution</h4>
            <svg viewBox="0 0 200 200" className="pie-chart">
              <path d={imageSlices.cancerPath} fill="#d9829b" />
              <path d={imageSlices.negativePath} fill="#3B8AC4" />
              <circle cx="100" cy="100" r="45" fill="white" />
              <text x="100" y="95" textAnchor="middle" className="pie-center-text">{imageTotal}</text>
              <text x="100" y="110" textAnchor="middle" className="pie-center-label">Images</text>
            </svg>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#d9829b'}}></span>
                <span>Cancer: {imageData.n_positive} ({imageCancerPct.toFixed(1)}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#3B8AC4'}}></span>
                <span>Negative: {imageData.n_negative} ({imageNegativePct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          <div className="dist-card full-width">
            <h4>Classification Accuracy</h4>
            <div className="horizontal-bars">
              <div className="bar-row">
                <div className="bar-label">Correct Cancer</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width: `${(correctCancer / totalAll) * 100}%`, backgroundColor: '#7A3F6D'}}></div>
                </div>
                <div className="bar-value">{correctCancer}</div>
              </div>
              <div className="bar-row">
                <div className="bar-label">Correct Negative</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width: `${(correctNegative / totalAll) * 100}%`, backgroundColor: '#3B8AC4'}}></div>
                </div>
                <div className="bar-value">{correctNegative}</div>
              </div>
              <div className="bar-row">
                <div className="bar-label">Incorrect Cancer</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width: `${(incorrectCancer / totalAll) * 100}%`, backgroundColor: '#D4A04D'}}></div>
                </div>
                <div className="bar-value">{incorrectCancer}</div>
              </div>
              <div className="bar-row">
                <div className="bar-label">Incorrect Negative</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width: `${(incorrectNegative / totalAll) * 100}%`, backgroundColor: '#D63E68'}}></div>
                </div>
                <div className="bar-value">{incorrectNegative}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="analysis-sections">
        {sections.map((section) => {
          if (!(config.visibleSections as any)[section.id]) return null;
          
          const rawData = evaluationData[section.dataKey] || {};
          const entries = Object.entries(rawData).map(([name, m]: [string, any]) => ({ 
            name, 
            ...m[viewMode] 
          })).filter(e => e.auc !== undefined);
          
          const currentFocus = getFocusValue(section.id);
          const isFocusActive = currentFocus && !['All', 'All Groups', 'All Patients'].includes(currentFocus);

          const rowCount = entries.length;
          const chartBaseHeight = 80 + (rowCount * 40);
          const barSpacing = Math.min(70, 380 / entries.length);
          const barWidth = Math.min(45, barSpacing * 0.7);

          return (
            <div key={section.id} className="panel fade-in">
              <h3>{section.title}</h3>
              <div className="side-by-side-layout">
                <div className="table-container">
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Subgroup</th>
                        <th>N</th>
                        <th>N+</th>
                        <th>N-</th>
                        <th>AUC</th>
                        <th>ACC</th>
                        <th>vs Baseline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((row) => {
                        const isFocused = isFocusActive && row.name.toString().toLowerCase() === currentFocus.toLowerCase();
                        const delta = (row.auc - baselineAuc) * 100;
                        const totalN = viewMode === 'exam' ? row.n_exams : row.n_images;
                        return (
                          <tr key={row.name} className={isFocused ? "highlighted-row" : ""}>
                            <td style={{ textAlign: 'left', fontWeight: 700 }}>{row.name}</td>
                            <td>{totalN}</td>
                            <td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{row.n_positive}</td>
                            <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{row.n_negative}</td>
                            <td style={{fontWeight: 900}}>{row.auc ? (row.auc * 100).toFixed(1) + '%' : 'N/A'}</td>
                            <td>{row.accuracy ? (row.accuracy * 100).toFixed(1) + '%' : 'N/A'}</td>
                            <td style={{ fontWeight: 800, color: delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {row.auc ? `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="chart-container-right">
                  <svg viewBox={`0 0 450 ${chartBaseHeight}`}>
                    {entries.map((item, i) => {
                      const isFocused = isFocusActive && item.name.toString().toLowerCase() === currentFocus.toLowerCase();
                      const x = 35 + i * barSpacing;
                      const barMaxHeight = chartBaseHeight - 70;
                      const barH = (item.auc || 0) * barMaxHeight;
                      return (
                        <g key={item.name} className={isFocusActive ? (isFocused ? "bar-group active" : "bar-group faded") : "bar-group"}>
                          <rect x={x} y={(chartBaseHeight - 50) - barH} width={barWidth} height={barH} fill={BRAND_COLORS[i % 6]} rx="8" />
                          <text x={x + barWidth/2} y={(chartBaseHeight - 55) - barH} textAnchor="middle" className="chart-text-pct" style={{ fontWeight: 900 }}>
                            {item.auc ? (item.auc * 100).toFixed(0) + '%' : ''}
                          </text>
                          <text x={x + barWidth/2} y={chartBaseHeight - 25} textAnchor="middle" className="chart-text-label" style={{ fontWeight: 700, fontSize: '11px' }}>
                            {item.name}
                          </text>
                        </g>
                      );
                    })}
                    <line x1="20" y1={chartBaseHeight - 50} x2="430" y2={chartBaseHeight - 50} stroke="#cbd5e0" strokeWidth="2" strokeDasharray="4" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisDashboard;