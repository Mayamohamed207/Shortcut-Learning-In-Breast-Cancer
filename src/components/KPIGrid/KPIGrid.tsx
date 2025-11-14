import React from 'react';
import KPICard from './KPICard';
import './KPIGrid.css';

const KPIGrid: React.FC = () => {
  const kpis = [
    {
      label: 'Model Accuracy',
      value: '87.3%',
      change: '+2.1% vs baseline',
      changeType: 'positive' as const
    },
    {
      label: 'Detected Shortcuts',
      value: '12',
      change: 'High Risk',
      changeType: 'negative' as const
    },
    {
      label: 'Processed Images',
      value: '55,624',
      change: 'Dataset Complete',
      changeType: 'positive' as const
    },
    {
      label: 'Bias Score',
      value: '0.23',
      change: 'Within Threshold',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};

export default KPIGrid;