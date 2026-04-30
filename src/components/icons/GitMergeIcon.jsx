// src/components/icons/GitMergeIcon.jsx
"use client";

import { clsx as cn } from "clsx";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const GitMergeIcon = forwardRef(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 24,
      duration = 0.8,
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

    const ease = [0.25, 1, 0.5, 1];

    const sourceNode = {
      normal: { scale: 1, opacity: 1 },
      animate: {
        scale: [0.7, 1.1, 1],
        opacity: [0, 1],
        transition: {
          duration: duration * 0.3,
          ease,
        },
      },
    };

    const mergePath = {
      normal: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0.3, 1],
        transition: {
          duration: duration * 0.6,
          ease,
          delay: duration * 0.15,
        },
      },
    };

    const resultNode = {
      normal: { scale: 1, opacity: 1 },
      animate: {
        scale: [0.6, 1.15, 1],
        opacity: [0, 1],
        transition: {
          duration: duration * 0.35,
          ease,
          delay: duration * 0.65,
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
        <svg
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
          <motion.circle
            cx="6"
            cy="6"
            r="3"
            style={{ transformOrigin: "center" }}
            variants={sourceNode}
            initial="normal"
            animate={controls}
          />

          <motion.path
            d="M6 21V9a9 9 0 0 0 9 11"
            variants={mergePath}
            initial="normal"
            animate={controls}
          />

          <motion.circle
            cx="18"
            cy="18"
            r="3"
            style={{ transformOrigin: "center" }}
            variants={resultNode}
            initial="normal"
            animate={controls}
          />
        </svg>
      </motion.div>
    );
  }
);

GitMergeIcon.displayName = "GitMergeIcon";

export { GitMergeIcon };