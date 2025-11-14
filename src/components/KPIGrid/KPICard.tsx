import React from 'react';

interface KPICardProps {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}

const KPICard: React.FC<KPICardProps> = ({ label, value, change, changeType }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-change ${changeType}`}>{change}</div>
    </div>
  );
};

export default KPICard;