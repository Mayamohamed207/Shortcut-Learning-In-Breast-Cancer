import React from 'react';
import EvaluationMetrics from './EvaluationMetrics';
import PerformanceTable from './PerformanceTable';
import './ModelComparison.css';

interface ModelComparisonProps {
  config: any;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ config }) => {
  return (
    <>
      <EvaluationMetrics />
      <PerformanceTable />
    </>
  );
};

export default ModelComparison;