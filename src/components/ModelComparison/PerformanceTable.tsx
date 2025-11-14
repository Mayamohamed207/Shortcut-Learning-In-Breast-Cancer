import React from 'react';

const PerformanceTable: React.FC = () => {
  const models = [
    {
      name: 'YALA Risk Prediction',
      accuracy: '87.3%',
      auc: '0.891',
      shortcuts: '12 Found',
      biasScore: '0.23',
      status: 'Review',
      statusType: 'warning'
    },
    {
      name: 'Mirai Model',
      accuracy: '84.7%',
      auc: '0.876',
      shortcuts: '8 Found',
      biasScore: '0.18',
      status: 'Monitor',
      statusType: 'info'
    },
    {
      name: 'AsymMirai',
      accuracy: '89.1%',
      auc: '0.903',
      shortcuts: '5 Found',
      biasScore: '0.14',
      status: 'Approved',
      statusType: 'success'
    }
  ];

  return (
    <div className="panel">
      <h3>Model Performance Comparison</h3>
      
      <div className="table-container">
        <table className="performance-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Accuracy</th>
              <th>AUC Score</th>
              <th>Shortcuts</th>
              <th>Bias Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr key={index}>
                <td className="model-name">{model.name}</td>
                <td className="metric-value">{model.accuracy}</td>
                <td className="metric-value">{model.auc}</td>
                <td>
                  <span className={`status-pill ${model.statusType === 'success' ? 'success' : model.statusType === 'warning' ? 'warning' : 'danger'}`}>
                    {model.shortcuts}
                  </span>
                </td>
                <td className="metric-value">{model.biasScore}</td>
                <td>
                  <span className={`status-pill ${model.statusType}`}>
                    {model.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="recommendation-box">
        <h5>Analysis Recommendation</h5>
        <p>
          AsymMirai shows the best balance of accuracy and bias reduction. Consider this model for clinical deployment after additional validation on diverse datasets.
        </p>
      </div>
    </div>
  );
};

export default PerformanceTable;