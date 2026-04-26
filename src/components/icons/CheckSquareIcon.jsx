"use client";

import { clsx as cn } from "clsx"; // Sesuaikan jika Anda menggunakan clsx langsung
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const CheckSquareIcon = forwardRef(
 (
  {
   onMouseEnter,
   onMouseLeave,
   className,
   size = 24,
   duration = 1,
   isAnimated = true,
   ...props
  },
  ref,
 ) => {
  const controls = useAnimation();
  const tickControls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () => {
     if (reduced) {
      controls.start("normal");
      tickControls.start("normal");
     } else {
      controls.start("animate");
      tickControls.start("animate");
     }
    },
    stopAnimation: () => {
     controls.start("normal");
     tickControls.start("normal");
    },
   };
  });

  const handleEnter = useCallback(
   (e) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) {
     controls.start("animate");
     tickControls.start("animate");
    } else {
     onMouseEnter?.(e);
    }
   },
   [controls, tickControls, reduced, onMouseEnter, isAnimated],
  );

  const handleLeave = useCallback(
   (e) => {
    if (!isControlled.current) {
     controls.start("normal");
     tickControls.start("normal");
    } else {
     onMouseLeave?.(e);
    }
   },
   [controls, tickControls, onMouseLeave],
  );

  // Animasi keseluruhan SVG memantul (Pop-up)
  const svgVariants = {
   normal: {
    scale: 1,
   },
   animate: {
    scale: [1, 1.12, 0.96, 1],
    transition: {
     duration: 0.45 * duration,
     ease: "easeOut",
    },
   },
  };

  // Animasi menggambar bingkai kotak
  const squareVariants = {
   normal: {
    pathLength: 1,
    opacity: 1,
   },
   animate: {
    pathLength: [0.7, 1],
    opacity: [0.7, 1],
    transition: {
     duration: 0.35 * duration,
     ease: "easeOut",
    },
   },
  };

  // Animasi menggambar centang
  const tickVariants = {
   normal: {
    pathLength: 1,
    opacity: 1,
   },
   animate: {
    pathLength: [0, 1],
    opacity: 1,
    transition: {
     duration: 0.3 * duration,
     delay: 0.12 * duration,
     ease: "easeOut",
    },
   },
  };

  return (
   <motion.div
    className={cn("inline-flex items-center justify-center", className)}
    onMouseEnter={handleEnter}
    onMouseLeave={handleLeave}
    {...props}
   >
    <motion.svg
     xmlns="http://www.w3.org/2000/svg"
     width={size}
     height={size}
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     strokeLinecap="round"
     strokeLinejoin="round"
     animate={controls}
     initial="normal"
     variants={svgVariants}
    >
     {/* Bingkai Kotak (Diambil dari Lucide SquareCheckBig, 
         dengan celah di sudut kanan atas untuk efek yang lebih dinamis) */}
     <motion.path
      d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"
      variants={squareVariants}
      initial="normal"
      animate={controls}
     />
     {/* Tanda Centang */}
     <motion.path
      d="m9 11 3 3L22 4"
      variants={tickVariants}
      initial="normal"
      animate={tickControls}
     />
    </motion.svg>
   </motion.div>
  );
 },
);

CheckSquareIcon.displayName = "CheckSquareIcon";
export { CheckSquareIcon };