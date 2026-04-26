"use client";

import { clsx as cn } from "clsx";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const Building2Icon = forwardRef(
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
    ref
  ) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () =>
          reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e);
      },
      [controls, reduced, isAnimated, onMouseEnter]
    );

    const handleLeave = useCallback(
      (e) => {
        if (!isControlled.current) controls.start("normal");
        else onMouseLeave?.(e);
      },
      [controls, onMouseLeave]
    );

    // Animasi menggambar struktur gedung utama
    const structureVariants = {
      normal: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.6 * duration, ease: "easeInOut" },
      },
    };

    // Animasi memunculkan pintu dan jendela
    const detailVariants = {
      normal: { opacity: 1, scale: 1 },
      animate: (customDelay) => ({
        opacity: [0, 1],
        scale: [0.8, 1.1, 1],
        transition: { 
          delay: 0.4 + customDelay, // Muncul setelah gedung hampir selesai digambar
          duration: 0.4 * duration, 
          ease: "easeOut" 
        },
      }),
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
        >
          {/* Garis Dasar Gedung & Atap */}
          <motion.path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" variants={structureVariants} initial="normal" animate={controls} />
          <motion.path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" variants={structureVariants} initial="normal" animate={controls} />
          <motion.path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" variants={structureVariants} initial="normal" animate={controls} />
          
          {/* Pintu Tengah */}
          <motion.path d="M10 22v-4a2 2 0 0 1 4 0v4" variants={detailVariants} custom={0.1} initial="normal" animate={controls} style={{ transformOrigin: "12px 22px" }} />
          
          {/* Jendela Atas Tengah */}
          <motion.path d="M10 6h4" variants={detailVariants} custom={0.2} initial="normal" animate={controls} style={{ transformOrigin: "12px 6px" }} />
          {/* Jendela Bawah Tengah */}
          <motion.path d="M10 10h4" variants={detailVariants} custom={0.3} initial="normal" animate={controls} style={{ transformOrigin: "12px 10px" }} />
          {/* Jendela Kanan */}
          <motion.path d="M14 14h4" variants={detailVariants} custom={0.4} initial="normal" animate={controls} style={{ transformOrigin: "16px 14px" }} />
          {/* Jendela Kiri */}
          <motion.path d="M6 16H2" variants={detailVariants} custom={0.5} initial="normal" animate={controls} style={{ transformOrigin: "4px 16px" }} />
        </motion.svg>
      </motion.div>
    );
  }
);

Building2Icon.displayName = "Building2Icon";
export { Building2Icon };