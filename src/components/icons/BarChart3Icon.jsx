"use client";

import { clsx as cn } from "clsx";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const BarChart3Icon = forwardRef(
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
        if (!isControlled.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, onMouseLeave]
    );

    const pathVariants = {
      normal: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.2 * duration },
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0.7, 1],
        transition: {
          duration: 0.6 * duration,
          ease: "easeInOut",
        },
      },
    };

    const chartVariants = {
      normal: {
        scale: 1,
        transition: { duration: 0.2 * duration },
      },
      animate: {
        scale: [1, 1.05, 1],
        transition: {
          duration: 0.6 * duration,
          ease: "easeInOut",
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
          variants={chartVariants}
          animate={controls}
          initial="normal"
        >
          {/* Path sudah disesuaikan dengan bentuk BarChart3 Vertikal milik Lucide */}
          <motion.path d="M3 3v18h18" variants={pathVariants} />
          <motion.path d="M18 17V9" variants={pathVariants} />
          <motion.path d="M13 17V5" variants={pathVariants} />
          <motion.path d="M8 17v-3" variants={pathVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);

BarChart3Icon.displayName = "BarChart3Icon";
export { BarChart3Icon };