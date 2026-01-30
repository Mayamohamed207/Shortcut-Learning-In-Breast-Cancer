import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [intersectionalData, setIntersectionalData] = useState<any[]>([]);
  const [focusRow, setFocusRow] = useState<any>(null);

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

  useEffect(() => {
    const fetchIntersectional = async () => {
        const formData = new FormData();
        formData.append('model_name', config.modelArchitecture);
        formData.append('view_mode', viewMode);

        const activeCols: string[] = [];
        if (config.racialGroup !== 'All Groups') activeCols.push('race');
        if (config.populationFilter !== 'All Patients') activeCols.push('age_binned');
        if (config.trainingDataset !== 'All') activeCols.push('tissueden');
        if (config.vendorFocus !== 'All') activeCols.push('Manufacturer');
        if (config.viewFocus !== 'All') activeCols.push('0_ViewCodeSequence_CodeMeaning');
        if (config.lateralityFocus !== 'All') activeCols.push('ImageLateralityFinal');

        if (activeCols.length === 0) {
            setIntersectionalData([]);
            return;
        }

        formData.append('columns', activeCols.join(','));

        try {
            const response = await fetch(`${API_URL}/evaluate_intersection`, { method: 'POST', body: formData });
            const result = await response.json();
            setIntersectionalData(result.data || []);
        } catch (e) { console.error("Intersectional API Error", e); }
    };
    fetchIntersectional();
  }, [config.modelArchitecture, config.racialGroup, config.populationFilter, config.trainingDataset, config.vendorFocus, config.viewFocus, config.lateralityFocus, viewMode]);

  useEffect(() => {
    const isAnyFilterActive = 
        config.racialGroup !== 'All Groups' || 
        config.populationFilter !== 'All Patients' || 
        config.trainingDataset !== 'All' || 
        config.vendorFocus !== 'All' || 
        config.viewFocus !== 'All' || 
        config.lateralityFocus !== 'All';

    if (isAnyFilterActive && intersectionalData.length > 0) {
        const found = intersectionalData.find(row => {
            let match = true;
            if (row.race && config.racialGroup !== 'All Groups') {
                if (row.race.toLowerCase() !== config.racialGroup.toLowerCase()) match = false;
            }
            if (row.age_binned && config.populationFilter !== 'All Patients') {
                if (row.age_binned !== config.populationFilter) match = false;
            }
            if (row.ImageLateralityFinal && config.lateralityFocus !== 'All') {
                if (row.ImageLateralityFinal.toLowerCase() !== config.lateralityFocus.toLowerCase()) match = false;
            }
            if (row.tissueden && config.trainingDataset !== 'All') {
                if (parseFloat(row.tissueden).toString() !== parseFloat(config.trainingDataset).toString()) match = false;
            }
            if (row.Manufacturer && config.vendorFocus !== 'All') {
                const vendorMap: any = { 'Hologic': 'HOLOGIC, Inc.', 'GE': 'GE MEDICAL SYSTEMS' };
                const target = vendorMap[config.vendorFocus] || config.vendorFocus;
                if (row.Manufacturer.toLowerCase() !== target.toLowerCase()) match = false;
            }
            if (row['0_ViewCodeSequence_CodeMeaning'] && config.viewFocus !== 'All') {
                const viewMap: any = { 'MLO': 'medio-lateral oblique', 'CC': 'cranio-caudal' };
                const target = viewMap[config.viewFocus] || config.viewFocus;
                if (row['0_ViewCodeSequence_CodeMeaning'].toLowerCase() !== target.toLowerCase()) match = false;
            }
            return match;
        });
        setFocusRow(found || null);
    } else {
        setFocusRow(null);
    }
  }, [intersectionalData, config]);

  const getCleanHeader = (key: string) => {
    const mapping: any = {
        '0_ViewCodeSequence_CodeMeaning': 'View Position',
        'age_binned': 'Age Group',
        'tissueden': 'Density',
        'Manufacturer': 'Vendor',
        'race': 'Race',
        'ImageLateralityFinal': 'Laterality'
    };
    return mapping[key] || key.toUpperCase().replace('_', ' ');
  };

  if (loading || !evaluationData) return <div className="loading">Updating Analytics...</div>;

  const currentData = evaluationData.overall[viewMode];
  const baselineAuc = currentData.auc;

  const getFocusValue = (sectionId: string) => {
    if (sectionId === 'view') {
        if (config.viewFocus === 'MLO') return 'medio-lateral oblique';
        if (config.viewFocus === 'CC') return 'cranio-caudal';
    }
    if (sectionId === 'density') return config.trainingDataset === 'All' ? 'All' : `${parseFloat(config.trainingDataset).toFixed(2)}`;
    if (sectionId === 'race') return config.racialGroup;
    if (sectionId === 'vendor') {
        if (config.vendorFocus === 'Hologic') return 'HOLOGIC, Inc.';
        if (config.vendorFocus === 'GE') return 'GE MEDICAL SYSTEMS';
    }
    if (sectionId === 'laterality') return config.lateralityFocus;
    if (sectionId === 'age') return config.populationFilter === 'All Patients' ? 'All' : config.populationFilter;
    return 'All';
  };

  const sections = [
    { id: 'race', title: 'Race Analysis', dataKey: 'by_race' },
    { id: 'density', title: 'Breast Density Analysis', dataKey: 'by_density' },
    { id: 'vendor', title: 'Vendor Analysis', dataKey: 'by_vendor' },
    { id: 'view', title: 'View Position Analysis', dataKey: 'by_view' },
    { id: 'laterality', title: 'Laterality Analysis', dataKey: 'by_laterality' },
    { id: 'age', title: 'Age Group Analysis', dataKey: 'by_age' },
  ];

  return (
    <div className="analysis-dashboard">
      <KPIGrid overall={currentData} loading={loading} viewMode={viewMode} />
      
      <div className="confusion-matrix-section">
        <h3>Prediction Results</h3>
        <div className="matrix-grid">
          <div className="matrix-card tp"><div className="matrix-label">True Positive</div><div className="matrix-value">{currentData.tp}</div></div>
          <div className="matrix-card tn"><div className="matrix-label">True Negative</div><div className="matrix-value">{currentData.tn}</div></div>
          <div className="matrix-card fp"><div className="matrix-label">False Positive</div><div className="matrix-value">{currentData.fp}</div></div>
          <div className="matrix-card fn"><div className="matrix-label">False Negative</div><div className="matrix-value">{currentData.fn}</div></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {focusRow && (
          <motion.div 
            key="intersectional-panel"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="panel" 
            style={{ marginBottom: '40px', overflow: 'hidden' }}
          >
            <h3>Intersectional Analysis</h3>
            <div className="table-container">
              <table className="performance-table">
                <thead>
                  <tr>
                    {Object.keys(focusRow)
                      .filter(key => !['auc', 'accuracy', 'tp', 'tn', 'fp', 'fn', 'n_positive', 'n_negative'].includes(key))
                      .map(col => <th key={col}>{getCleanHeader(col)}</th>)
                    }
                    <th>Total (N)</th>
                    <th>N+</th>
                    <th>N-</th>
                    <th>TP</th>
                    <th>TN</th>
                    <th>FP</th>
                    <th>FN</th>
                    <th>AUC</th>
                    <th>ACC</th>
                    <th>vs Baseline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="highlighted-row">
                    {Object.keys(focusRow)
                      .filter(key => !['auc', 'accuracy', 'tp', 'tn', 'fp', 'fn', 'n_positive', 'n_negative'].includes(key))
                      .map(col => <td key={col} style={{ fontWeight: 700 }}>{focusRow[col]}</td>)
                    }
                    <td>{focusRow.n_positive + focusRow.n_negative}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{focusRow.n_positive}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{focusRow.n_negative}</td>
                    <td>{focusRow.tp}</td>
                    <td>{focusRow.tn}</td>
                    <td>{focusRow.fp}</td>
                    <td>{focusRow.fn}</td>
                    <td style={{ fontWeight: 900 }}>{(focusRow.auc * 100).toFixed(2)}%</td>
                    <td>{(focusRow.accuracy * 100).toFixed(2)}%</td>
                    <td style={{ fontWeight: 800, color: (focusRow.auc - baselineAuc) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {(focusRow.auc - baselineAuc) >= 0 ? '▲' : '▼'} {Math.abs((focusRow.auc - baselineAuc) * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="analysis-sections">
        {sections.map((section) => {
          if (!(config.visibleSections as any)[section.id]) return null;
          const rawData = evaluationData[section.dataKey] || {};
          const entries = Object.entries(rawData).map(([name, m]: [string, any]) => ({ name, ...m[viewMode] })).filter(e => e.auc !== undefined);
          const currentFocus = getFocusValue(section.id);
          const isFocusActive = currentFocus && !['All', 'All Groups', 'All Patients'].includes(currentFocus);
          const chartBaseHeight = 80 + (entries.length * 40);

          return (
            <div key={section.id} className="panel fade-in">
              <h3>{section.title}</h3>
              <div className="side-by-side-layout">
                <div className="table-container">
                  <table className="performance-table">
                    <thead>
                      <tr><th>Subgroup</th><th>N</th><th>N+</th><th>N-</th><th>AUC</th><th>ACC</th><th>vs Baseline</th></tr>
                    </thead>
                    <tbody>
                      {entries.map((row) => {
                        const isFocused = isFocusActive && row.name.toString().toLowerCase() === currentFocus.toLowerCase();
                        const delta = (row.auc - baselineAuc) * 100;
                        return (
                          <tr key={row.name} className={isFocused ? "highlighted-row" : ""}>
                            <td style={{ textAlign: 'left', fontWeight: 700 }}>{row.name}</td>
                            <td>{row.n_positive + row.n_negative}</td>
                            <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{row.n_positive}</td>
                            <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{row.n_negative}</td>
                            <td style={{ fontWeight: 900 }}>{(row.auc * 100).toFixed(2)}%</td>
                            <td>{(row.accuracy * 100).toFixed(2)}%</td>
                            <td style={{ fontWeight: 800, color: delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}%
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
                      const x = 35 + i * (380 / entries.length);
                      const barH = (item.auc || 0) * (chartBaseHeight - 70);
                      return (
                        <g key={item.name} className={isFocusActive ? (isFocused ? "bar-group active" : "bar-group faded") : "bar-group"}>
                          <rect x={x} y={(chartBaseHeight - 50) - barH} width={Math.min(45, (380 / entries.length) * 0.7)} height={barH} fill={BRAND_COLORS[i % 6]} rx="8" />
                          <text x={x + 15} y={chartBaseHeight - 25} textAnchor="middle" className="chart-text-label" style={{ fontSize: '10px' }}>{item.name}</text>
                        </g>
                      );
                    })}
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