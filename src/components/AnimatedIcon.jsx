import { motion } from 'framer-motion';

export function AnimatedIcon({ children, variant = 'scale', className = '' }) {

  const variants = {
    scale: {
      hover: { scale: 1.12 },
      tap: { scale: 0.9 }
    },
    slideRight: {
      hover: { x: 4 }
    },
    spin: {
      hover: { rotate: 90 }
    },
    wiggle: {
      hover: {
        rotate: [0, -8, 8, -6, 6, 0],
        transition: { duration: 0.4 }
      }
    },
    pulse: {
      animate: {
        scale: [1, 1.1, 1]
      },
      transition: {
        repeat: Infinity,
        duration: 1.5
      }
    }
  };

  const selected = variants[variant] || variants.scale;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      variants={selected}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </motion.div>
  );
}