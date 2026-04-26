import { motion } from 'framer-motion';

export function AnimatedIcon({ children, variant = 'scale', className = '' }) {
  const variants = {
    scale: {
      hover: { scale: 1.15 }
    },
    slideRight: {
      hover: { x: 4 }
    },
    spin: {
      hover: { rotate: 90 }
    },
    wiggle: {
      hover: { rotate: [0, -10, 10, -10, 10, 0] }
    }
  };

  return (
    <motion.div
      whileHover="hover"
      whileTap={{ scale: 0.9 }}
      variants={variants[variant]}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </motion.div>
  );
}