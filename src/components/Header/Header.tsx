import React from 'react';
import { motion } from 'framer-motion';
import './Header.css';
import ShimmerButton from '../common/ShimmerButton';
import GradientText from '../common/GradientText';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="brand">
        <motion.div 
          className="brand-logo"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          BC
        </motion.div>
        <div className="brand-text">
          <GradientText>Shortcut</GradientText> In Breast Cancer
        </div>
      </div>
      <div className="header-actions">
         <motion.button 
          className="btn btn-ghost"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m7.07-11.93l-4.24 4.24m-5.66 0L4.93 6.07m0 11.86l4.24-4.24m5.66 0l4.24 4.24"/>
          </svg>
          Settings
        </motion.button>
        <button className="btn btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Data
        </button>
        <motion.button 
          className="btn btn-primary"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Run Analysis
        </motion.button>
      </div>
    </header>
  );
};

export default Header;