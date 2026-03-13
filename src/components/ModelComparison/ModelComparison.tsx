import React, { useState, useEffect } from 'react';
import './ModelComparison.css';
import { ConfigState } from '../../App';

const API_URL = 'http://localhost:8000';

interface ModelComparisonProps {
  config: ConfigState;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ config }) => {
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'exam' | 'image'>('exam');
  const [radarHover, setRadarHover] = useState(false);

  const modelList = [
    { id: 'base_model', name: 'Base Model', color: '#d9829b' },
    { id: 'segmented_model', name: 'Segmented Model', color: '#7A3F6D' },
    { id: 'background_model', name: 'Background Model', color: '#3B8AC4' }
  ];

  useEffect(() => {
    fetchAllModels();
  }, []);

  const fetchAllModels = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        modelList.map(async (model) => {
          const formData = new FormData();
          formData.append('model_name', model.id);
          const response = await fetch(`${API_URL}/evaluate_model_csv`, { method: 'POST', body: formData });
          const data = await response.json();
          
          return {
            id: model.id,
            name: model.name,
            color: model.color,
            examData: data.overall.exam,
            imageData: data.overall.image,
            subgroups: {
              by_race: data.by_race,
              by_age: data.by_age,
              by_density: data.by_density,
              by_view: data.by_view,
              by_laterality: data.by_laterality,
              by_vendor: data.by_vendor
            }
          };
        })
      );
      setComparisonData(results);
    } catch (e) {
      console.error("Comparison Error", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Model Comparisons...</div>;
  if (comparisonData.length === 0) return <div className="loading">No data available</div>;

  const getCurrentData = (model: any) => viewMode === 'exam' ? model.examData : model.imageData;

  const metrics = ['auc', 'accuracy'];
  const metricLabels = {
    auc: 'AUC',
    accuracy: 'ACC',
  };

  return (
    <div className="model-comparison-view">
      <div className="comparison-header">
        <h2>Model Comparison Dashboard</h2>
        <div className="view-toggle-compact">
          <button 
            className={viewMode === 'exam' ? 'active' : ''} 
            onClick={() => setViewMode('exam')}
          >
            Per Exam
          </button>
          <button 
            className={viewMode === 'image' ? 'active' : ''} 
            onClick={() => setViewMode('image')}
          >
            Per Image
          </button>
        </div>
      </div>

      <div className="metrics-overview">
        <h3>Performance Metrics Comparison</h3>
        <div className="metrics-cards">
          {metrics.map((metric) => {
            const maxValue = Math.max(...comparisonData.map(m => getCurrentData(m)[metric]));
            return (
              <div key={metric} className="metric-comparison-card">
                <h4>{metricLabels[metric as keyof typeof metricLabels]}</h4>
                <div className="model-bars">
                  {comparisonData.map((model) => {
                    const value = getCurrentData(model)[metric];
                    const percentage = (value / maxValue) * 100;
                    return (
                      <div key={model.id} className="model-bar-row">
                        <div className="model-name-label">{model.name}</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill-comp" 
                            style={{ width: `${percentage}%`, backgroundColor: model.color }}
                          ></div>
                        </div>
                        <div className="bar-value-comp">{(value * 100).toFixed(2)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="confusion-matrices-section">
        <h3>Confusion Matrix Comparison</h3>
        <div className="model-legend">
          {comparisonData.map((model) => (
            <div key={model.id} className="model-legend-item">
              <span className="legend-square" style={{ backgroundColor: model.color }}></span>
              <span>{model.name}</span>
            </div>
          ))}
        </div>
        <div className="matrices-grid">
          {comparisonData.map((model) => {
            const data = getCurrentData(model);
            return (
              <div key={model.id} className="matrix-card-container" style={{ borderColor: model.color }}>
                <div className="confusion-matrix-grid">
                  <div className="matrix-corner"></div>
                  <div className="matrix-header-cell">Predicted Positive</div>
                  <div className="matrix-header-cell">Predicted Negative</div>
                  
                  <div className="matrix-header-cell">True Positive</div>
                  <div className="matrix-data-cell tp-cell">
                    <div className="cell-label">TP</div>
                    <div className="cell-value">{data.tp}</div>
                  </div>
                  <div className="matrix-data-cell fn-cell">
                    <div className="cell-label">FN</div>
                    <div className="cell-value">{data.fn}</div>
                  </div>
                  
                  <div className="matrix-header-cell">True Negative</div>
                  <div className="matrix-data-cell fp-cell">
                    <div className="cell-label">FP</div>
                    <div className="cell-value">{data.fp}</div>
                  </div>
                  <div className="matrix-data-cell tn-cell">
                    <div className="cell-label">TN</div>
                    <div className="cell-value">{data.tn}</div>
                  </div>
                </div>
                <div className="matrix-summary">
                  <div className="summary-item">
                    <span>Correct:</span>
                    <strong>{data.tp + data.tn}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Incorrect:</span>
                    <strong>{data.fp + data.fn}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detailed-comparison-table">
        <h3>Detailed Performance Table</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>N {viewMode === 'exam' ? 'Exams' : 'Images'}</th>
              <th>N Cancer</th>
              <th>N Negative</th>
              <th>TP</th>
              <th>TN</th>
              <th>FP</th>
              <th>FN</th>
               <th>AUC</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
        {comparisonData.map((model) => {
          const data = getCurrentData(model);
         
          const total = (data.tp || 0) + (data.tn || 0) + (data.fp || 0) + (data.fn || 0);

          const nPositive = data.n_positive ?? (data.tp + data.fn);
          const nNegative = data.n_negative ?? (data.tn + data.fp);

          return (
            <tr key={model.id}>
              <td style={{ fontWeight: 700, color: model.color }}>{model.name}</td>
              <td style={{ fontWeight: 600 }}>{total}</td> 
              <td>{nPositive}</td>
              <td>{nNegative}</td>
              <td style={{ fontWeight: 900 }}>{(data.auc * 100).toFixed(2)}%</td>
              <td>{(data.accuracy * 100).toFixed(2)}%</td>
              <td>{data.tp}</td>
              <td>{data.tn}</td>
              <td>{data.fp}</td>
              <td>{data.fn}</td>
            </tr>
          );
        })}
          </tbody>
        </table>
      </div>

     

      <div className="subgroup-comparison-section">
        <h3>Subgroup Performance Comparison</h3>
        <div className="subgroup-tabs">
          {['Race', 'Age', 'Density', 'View', 'Laterality', 'Vendor'].map((subgroup) => (
            <div key={subgroup} className="subgroup-panel">
              <h4>{subgroup} Analysis</h4>
              <div className="subgroup-legend">
                {comparisonData.map((model) => (
                  <div key={model.id} className="subgroup-legend-item">
                    <span className="legend-square-small" style={{ backgroundColor: model.color }}></span>
                    <span>{model.name}</span>
                  </div>
                ))}
              </div>
              <svg viewBox="0 0 600 300" className="subgroup-chart">
                {comparisonData.map((model, modelIdx) => {
                  const subgroupKey = `by_${subgroup.toLowerCase()}` as keyof typeof model.subgroups;
                  const subgroupData = model.subgroups[subgroupKey] || {};
                  const entries = Object.entries(subgroupData);
                  
                  return entries.map(([key, value]: [string, any], entryIdx) => {
                    const x = 80 + entryIdx * 120;
                    const y = 250 - ((value[viewMode]?.auc || 0) * 200);
                    const barWidth = 30;
                    const xOffset = modelIdx * (barWidth + 5);
                    
                    return (
                      <g key={`${model.id}-${key}`}>
                        <rect 
                          x={x + xOffset} 
                          y={y} 
                          width={barWidth} 
                          height={250 - y} 
                          fill={model.color} 
                          rx="4"
                        />
                        <text 
                          x={x + xOffset + barWidth/2} 
                          y={y - 5} 
                          textAnchor="middle" 
                          style={{ fontSize: '10px', fontWeight: 700, fill: model.color }}
                        >
                          {((value[viewMode]?.auc || 0) * 100).toFixed(0)}%
                        </text>
                        {modelIdx === 0 && (
                          <text 
                            x={x + 40} 
                            y={270} 
                            textAnchor="middle" 
                            style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }}
                          >
                            {key}
                          </text>
                        )}
                      </g>
                    );
                  });
                })}
                <line x1="50" y1="250" x2="580" y2="250" stroke="#cbd5e0" strokeWidth="2" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelComparison;