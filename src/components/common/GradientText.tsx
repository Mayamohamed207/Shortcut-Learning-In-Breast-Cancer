import React from 'react';
import './GradientText.css';

interface GradientTextProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
}

const GradientText: React.FC<GradientTextProps> = ({ 
  children, 
  from = '#FF96A7', 
  to = '#69D8EE' 
}) => {
  return (
    <span
      className="gradient-text"
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
};

export default GradientText;