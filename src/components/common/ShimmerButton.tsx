import { motion } from 'framer-motion';
import React from 'react';
import './ShimmerButton.css';

interface ShimmerButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const ShimmerButton: React.FC<ShimmerButtonProps> = ({ children, onClick, className = '' }) => {
  return (
    <motion.button
      className={`shimmer-button ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="shimmer-button-content">{children}</span>
      <motion.div
        className="shimmer-effect"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: 'linear',
          repeatDelay: 1,
        }}
      />
    </motion.button>
  );
};

export default ShimmerButton;