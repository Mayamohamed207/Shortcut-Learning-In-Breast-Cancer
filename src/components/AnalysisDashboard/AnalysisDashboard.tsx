import React from 'react';
import KPIGrid from '../KPIGrid/KPIGrid';
import ModelPerformance from './ModelPerformance';
import TemporalAnalysis from './TemporalAnalysis';
import './AnalysisDashboard.css';

const AnalysisDashboard: React.FC = () => {
  return (
    <>
      <KPIGrid />
      <TemporalAnalysis />
    </>
  );
};

export default AnalysisDashboard;
