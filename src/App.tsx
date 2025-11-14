import React, { useState } from 'react';
import './App.css';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import Tabs from './components/Tabs/Tabs';
import AnalysisDashboard from './components/AnalysisDashboard/AnalysisDashboard';
import ModelComparison from './components/ModelComparison/ModelComparison';
import MammogramViewer from './components/MammogramViewer/MammogramViewer';

export interface ConfigState {
  modelArchitecture: string;
  trainingDataset: string;
  riskHorizon: number;
  confidence: number;
  maskContralateral: boolean;
  enableShortcuts: boolean;
  populationFilter: string;
  racialGroup: string;
  showAttention: boolean;
  showShortcuts: boolean;
  showSegmentation: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('mammogram');
  
  const [config, setConfig] = useState<ConfigState>({
    modelArchitecture: 'YALA Risk Prediction',
    trainingDataset: 'EMBED (Full)',
    riskHorizon: 3,
    confidence: 85,
    maskContralateral: false,
    enableShortcuts: true,
    populationFilter: 'All Patients',
    racialGroup: 'All Groups',
    showAttention: true,
    showShortcuts: true,
    showSegmentation: false,
  });

  const showSidebar = activeTab !== 'mammogram';

  return (
    <div className="app">
      <Header />

      <div className="app-body">
        {showSidebar && (
          <Sidebar config={config} setConfig={setConfig} />
        )}

        <div className="content-area">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="tab-content">
            {activeTab === 'analysis' && <AnalysisDashboard />}
            {activeTab === 'comparison' && <ModelComparison config={config} />}
            {activeTab === 'mammogram' && <MammogramViewer />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;