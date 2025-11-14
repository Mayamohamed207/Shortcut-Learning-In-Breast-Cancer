import { motion } from 'framer-motion';
import React from 'react';

interface BlurFadeProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
}

const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 20,
  blur = '10px',
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: yOffset,
        filter: `blur(${blur})`,
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      transition={{
        delay,
        duration,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
};

export default BlurFade;