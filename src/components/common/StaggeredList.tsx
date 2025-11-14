
import { motion } from 'framer-motion';
import React from 'react';

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
}

const StaggeredList: React.FC<StaggeredListProps> = ({ 
  children, 
  staggerDelay = 0.1 
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {React.Children.map(children, (child) => (
        <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
};

export default StaggeredList;