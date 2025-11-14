import { motion } from 'framer-motion';
import React from 'react';
import './BorderBeam.css';

interface BorderBeamProps {
  children: React.ReactNode;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

const BorderBeam: React.FC<BorderBeamProps> = ({
  children,
  duration = 15,
  colorFrom = '#FF96A7',
  colorTo = '#69D8EE',
}) => {
  return (
    <div className="border-beam-container">
      <motion.div
        className="border-beam"
        style={{
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="border-beam-content">{children}</div>
    </div>
  );
};

export default BorderBeam;