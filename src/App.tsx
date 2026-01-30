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
  vendorFocus: string;
  viewFocus: string;
  lateralityFocus: string;
  showAttention: boolean;
  showShortcuts: boolean;
  showSegmentation: boolean;
  visibleSections: {
    race: boolean;
    age: boolean;
    density: boolean;
    vendor: boolean;
    view: boolean;
    laterality: boolean;
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('analysis');
  const [viewMode, setViewMode] = useState<'exam' | 'image'>('exam');
  
  const [config, setConfig] = useState<ConfigState>({
    modelArchitecture: 'base_model', 
    trainingDataset: 'All',
    riskHorizon: 3,
    confidence: 85,
    maskContralateral: false,
    enableShortcuts: true,
    populationFilter: 'All Patients',
    racialGroup: 'All Groups',
    vendorFocus: 'All',
    viewFocus: 'All',
    lateralityFocus: 'All',
    showAttention: true,
    showShortcuts: true,
    showSegmentation: false,
    visibleSections: {
      race: true,
      age: true,
      density: true,
      vendor: true,
      view: true,
      laterality: true,
    }
  });

  const handleModelSwitch = (modelId: string) => {
    setConfig(prev => ({ ...prev, modelArchitecture: modelId }));
  };

  const handleViewModeChange = (mode: 'exam' | 'image') => {
    setViewMode(mode);
  };

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        {activeTab === 'analysis' && (
          <Sidebar 
            config={config} 
            setConfig={setConfig} 
            currentModel={config.modelArchitecture} 
            onModelSwitch={handleModelSwitch}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
        )}
        <div className="content-area">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="tab-content">
            {activeTab === 'analysis' && <AnalysisDashboard config={config} viewMode={viewMode} />}
            {activeTab === 'comparison' && <ModelComparison config={config} />}
            {activeTab === 'mammogram' && <MammogramViewer />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;