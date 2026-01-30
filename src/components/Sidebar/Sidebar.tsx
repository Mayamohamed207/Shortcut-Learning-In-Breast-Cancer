import React from 'react';
import { motion } from 'framer-motion';
import './Sidebar.css';
import { ConfigState } from '../../App';

const Icons = {
  Brain: () => <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.54-2.44 2.5 2.5 0 0 1-2-2.5 2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2.54-2.44A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.54-2.44 2.5 2.5 0 0 0 2-2.5 2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 0-2.54-2.44A2.5 2.5 0 0 0 14.5 2z" strokeWidth="2"/></svg>,
  Layers: () => <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/></svg>,
  Users: () => <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/><circle cx="9" cy="7" r="4" strokeWidth="2"/></svg>,
  Image: () => <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/><polyline points="21 15 16 10 5 21" strokeWidth="2"/></svg>,
  View: () => <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>
};

interface SidebarProps {
  config: ConfigState;
  setConfig: React.Dispatch<React.SetStateAction<ConfigState>>;
  currentModel: string;
  onModelSwitch: (model: string) => void;
  viewMode: 'exam' | 'image';
  onViewModeChange: (mode: 'exam' | 'image') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, currentModel, onModelSwitch, viewMode, onViewModeChange }) => {
  const itemVariants = { hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } };

  const toggleSection = (section: keyof typeof config.visibleSections) => {
    setConfig({
      ...config,
      visibleSections: { ...config.visibleSections, [section]: !config.visibleSections[section] }
    });
  };

  const handleDensityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isAll = e.target.checked;
    setConfig({
      ...config,
      trainingDataset: isAll ? 'All' : '1'
    });
  };

  return (
    <motion.aside className="sidebar" initial="hidden" animate="visible">
      
      <motion.div className="control-group" variants={itemVariants}>
        <h3><Icons.Brain /> Model Architecture</h3>
        <div className="form-group">
          <label>Select a model</label>
          <select value={currentModel} onChange={(e) => onModelSwitch(e.target.value)}>
            <option value="base_model">Base Model</option>
            <option value="segmented_model">Segmented</option>
            <option value="background_model">Background</option>
          </select>
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3><Icons.View /> Analysis Level</h3>
        <div className="radio-group">
          <div className="radio-wrapper">
            <input 
              type="radio" 
              id="view-exam" 
              name="viewMode"
              checked={viewMode === 'exam'} 
              onChange={() => onViewModeChange('exam')} 
            />
            <label htmlFor="view-exam">Per Exam Analysis</label>
          </div>
          <div className="radio-wrapper">
            <input 
              type="radio" 
              id="view-image" 
              name="viewMode"
              checked={viewMode === 'image'} 
              onChange={() => onViewModeChange('image')} 
            />
            <label htmlFor="view-image">Per Image Analysis</label>
          </div>
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3><Icons.Layers /> Visible Layers</h3>
        <div className="checkbox-grid">
          {Object.keys(config.visibleSections).map((sec) => (
            <div className="checkbox-wrapper" key={sec}>
              <input 
                type="checkbox" 
                id={`vis-${sec}`} 
                checked={(config.visibleSections as any)[sec]} 
                onChange={() => toggleSection(sec as keyof typeof config.visibleSections)} 
              />
              <label htmlFor={`vis-${sec}`}>{sec}</label>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3><Icons.Users /> Population Focus</h3>
        <div className="form-group">
          <label>Race Focus</label>
          <select value={config.racialGroup} onChange={(e) => setConfig({ ...config, racialGroup: e.target.value })}>
            <option value="All Groups">Show All</option>
            <option value="White">White</option>
            <option value="Black">Black</option>
            <option value="Asian">Asian</option>
          </select>
        </div>

        <div className="form-group">
          <label>Age Group</label>
          <select value={config.populationFilter} onChange={(e) => setConfig({ ...config, populationFilter: e.target.value })}>
            <option value="All Patients">All Ages</option>
            <option value="<50">&lt;50</option>
            <option value="50-75">50-75</option>
            <option value=">=75">&gt;=75</option>
          </select>
        </div>

        <div className="form-group">
          <div className="density-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Breast Density</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>All</span>
              <input 
                type="checkbox" 
                checked={config.trainingDataset === 'All'} 
                onChange={handleDensityToggle}
              />
            </div>
          </div>
          <input 
            type="range" min="1" max="4" step="1" 
            disabled={config.trainingDataset === 'All'}
            value={config.trainingDataset === 'All' ? '1' : config.trainingDataset} 
            onChange={(e) => setConfig({ ...config, trainingDataset: e.target.value })} 
            style={{ opacity: config.trainingDataset === 'All' ? 0.5 : 1 }}
          />
          <div className="slider-labels">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3><Icons.Image /> Image Parameters</h3>
        <div className="form-group">
          <label>Manufacturer</label>
          <div className="segmented-control">
            {['All', 'Hologic', 'GE'].map((v) => (
              <button 
                key={v} 
                className={`segment-btn ${config.vendorFocus === v ? 'active' : ''}`} 
                onClick={() => setConfig({ ...config, vendorFocus: v })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>View Position</label>
          <div className="segmented-control">
            {['All', 'MLO', 'CC'].map((v) => (
              <button 
                key={v} 
                className={`segment-btn ${config.viewFocus === v ? 'active' : ''}`} 
                onClick={() => setConfig({ ...config, viewFocus: v })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Laterality</label>
          <div className="segmented-control">
            {['All', 'L', 'R'].map((v) => (
              <button 
                key={v} 
                className={`segment-btn ${config.lateralityFocus === v ? 'active' : ''}`} 
                onClick={() => setConfig({ ...config, lateralityFocus: v })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;