import React from 'react';
import { motion } from 'framer-motion';
import './Sidebar.css';
import { ConfigState } from '../../App';

interface SidebarProps {
  config: ConfigState;
  setConfig: React.Dispatch<React.SetStateAction<ConfigState>>;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.aside 
      className="sidebar"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="control-group" variants={itemVariants}>
        <h3>Model Configuration</h3>
        <div className="form-group">
          <label>Model Architecture</label>
          <select
            value={config.modelArchitecture}
            onChange={(e) => setConfig({ ...config, modelArchitecture: e.target.value })}
          >
            <option>YALA Risk Prediction</option>
            <option>Mirai Model</option>
            <option>AsymMirai</option>
            <option>Custom CNN</option>
          </select>
        </div>
        <div className="form-group">
          <label>Training Dataset</label>
          <select
            value={config.trainingDataset}
            onChange={(e) => setConfig({ ...config, trainingDataset: e.target.value })}
          >
            <option>EMBED (Full)</option>
            <option>EMBED (Screening Only)</option>
            <option>Custom Dataset</option>
          </select>
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3>Analysis Parameters</h3>
        <div className="form-group">
          <label>Risk Prediction Horizon</label>
          <div className="slider-group">
            <div className="slider-wrapper">
              <input
                type="range"
                min="1"
                max="5"
                value={config.riskHorizon}
                onChange={(e) => setConfig({ ...config, riskHorizon: parseInt(e.target.value) })}
              />
            </div>
            <motion.div 
              className="slider-value"
              key={config.riskHorizon}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {config.riskHorizon} years
            </motion.div>
          </div>
        </div>

        <div className="form-group">
          <label>Confidence Threshold</label>
          <div className="slider-group">
            <div className="slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={config.confidence}
                onChange={(e) => setConfig({ ...config, confidence: parseInt(e.target.value) })}
              />
            </div>
            <motion.div 
              className="slider-value"
              key={config.confidence}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {config.confidence}%
            </motion.div>
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <motion.div 
              className="checkbox-wrapper"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="checkbox"
                id="mask-contralateral"
                checked={config.maskContralateral}
                onChange={(e) => setConfig({ ...config, maskContralateral: e.target.checked })}
              />
              <label htmlFor="mask-contralateral">Mask Contralateral Breast</label>
            </motion.div>
          </div>
          <div className="checkbox-group">
            <motion.div 
              className="checkbox-wrapper"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="checkbox"
                id="enable-shortcuts"
                checked={config.enableShortcuts}
                onChange={(e) => setConfig({ ...config, enableShortcuts: e.target.checked })}
              />
              <label htmlFor="enable-shortcuts">Enable Shortcut Detection</label>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3>Demographic Analysis</h3>
        <div className="form-group">
          <label>Population Filter</label>
          <select
            value={config.populationFilter}
            onChange={(e) => setConfig({ ...config, populationFilter: e.target.value })}
          >
            <option>All Patients</option>
            <option>Age 40-50</option>
            <option>Age 50-65</option>
            <option>Age 65+</option>
          </select>
        </div>
        <div className="form-group">
          <label>Racial/Ethnic Groups</label>
          <select
            value={config.racialGroup}
            onChange={(e) => setConfig({ ...config, racialGroup: e.target.value })}
          >
            <option>All Groups</option>
            <option>White/Caucasian</option>
            <option>African American</option>
            <option>Asian</option>
            <option>Hispanic/Latino</option>
          </select>
        </div>
      </motion.div>

      <motion.div className="control-group" variants={itemVariants}>
        <h3>Visualization Options</h3>
        <div className="form-group">
          <div className="checkbox-group">
            <motion.div 
              className="checkbox-wrapper"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="checkbox"
                id="show-attention"
                checked={config.showAttention}
                onChange={(e) => setConfig({ ...config, showAttention: e.target.checked })}
              />
              <label htmlFor="show-attention">Show Attention Heatmaps</label>
            </motion.div>
          </div>
          <div className="checkbox-group">
            <motion.div 
              className="checkbox-wrapper"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="checkbox"
                id="show-shortcuts"
                checked={config.showShortcuts}
                onChange={(e) => setConfig({ ...config, showShortcuts: e.target.checked })}
              />
              <label htmlFor="show-shortcuts">Highlight Shortcuts</label>
            </motion.div>
          </div>
          <div className="checkbox-group">
            <motion.div 
              className="checkbox-wrapper"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="checkbox"
                id="show-segmentation"
                checked={config.showSegmentation}
                onChange={(e) => setConfig({ ...config, showSegmentation: e.target.checked })}
              />
              <label htmlFor="show-segmentation">Show Breast Segmentation</label>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;