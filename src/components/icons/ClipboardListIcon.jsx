"use client";

import { clsx as cn } from "clsx"; // Menggunakan clsx sesuai setup Anda
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const ClipboardListIcon = forwardRef(
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
  const bodyControls = useAnimation();
  const clipControls = useAnimation();
  const listControls = useAnimation(); // Tambahan kontrol untuk garis list
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () => {
     if (reduced) {
      bodyControls.start("normal");
      clipControls.start("normal");
      listControls.start("normal");
     } else {
      bodyControls.start("animate");
      clipControls.start("animate");
      listControls.start("animate");
     }
    },
    stopAnimation: () => {
     bodyControls.start("normal");
     clipControls.start("normal");
     listControls.start("normal");
    },
   };
  });

  const handleEnter = useCallback(
   (e) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) {
     bodyControls.start("animate");
     clipControls.start("animate");
     listControls.start("animate");
    } else onMouseEnter?.(e);
   },
   [bodyControls, clipControls, listControls, reduced, onMouseEnter, isAnimated],
  );

  const handleLeave = useCallback(
   (e) => {
    if (!isControlled.current) {
     bodyControls.start("normal");
     clipControls.start("normal");
     listControls.start("normal");
    } else onMouseLeave?.(e);
   },
   [bodyControls, clipControls, listControls, onMouseLeave],
  );

  // Animasi Papan (Bawaan AnimateIcons)
  const bodyVariants = {
   normal: { strokeDashoffset: 0, y: 0 },
   animate: {
    strokeDashoffset: [240, 0],
    transition: { duration: 1 * duration, ease: "easeInOut" },
    y: [0, -2, 0],
   },
  };

  // Animasi Penjepit Atas (Bawaan AnimateIcons)
  const clipVariants = {
   normal: { strokeDashoffset: 0, y: 0 },
   animate: {
    strokeDashoffset: [60, 0],
    transition: { duration: 1 * duration, ease: "easeInOut", delay: 0.2 },
    y: [0, -2, 0],
   },
  };

  // Animasi Baru untuk Garis & Titik (List)
  const listVariants = {
   normal: { pathLength: 1, opacity: 1 },
   animate: (customDelay) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: { 
      duration: 0.4 * duration, 
      ease: "easeOut", 
      delay: 0.5 + customDelay // Muncul setelah papan selesai digambar
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
     {/* Penjepit Atas */}
     <motion.rect
      x="8"
      y="2"
      width="8"
      height="4"
      rx="1"
      ry="1"
      initial="normal"
      animate={clipControls}
      variants={clipVariants}
      style={{ strokeDasharray: 60, strokeLinecap: "round" }}
     />
     
     {/* Papan Kertas */}
     <motion.path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      initial="normal"
      animate={bodyControls}
      variants={bodyVariants}
      style={{ strokeDasharray: 240, strokeLinecap: "round" }}
     />

     {/* --- MULAI TAMBAHAN LUCIDE CLIPBOARD-LIST --- */}
     
     {/* Titik Atas */}
     <motion.path 
      d="M8 11h.01" 
      initial="normal" 
      animate={listControls} 
      variants={listVariants} 
      custom={0} 
     />
     {/* Garis Atas */}
     <motion.path 
      d="M12 11h4" 
      initial="normal" 
      animate={listControls} 
      variants={listVariants} 
      custom={0.1} 
     />
     
     {/* Titik Bawah */}
     <motion.path 
      d="M8 16h.01" 
      initial="normal" 
      animate={listControls} 
      variants={listVariants} 
      custom={0.2} 
     />
     {/* Garis Bawah */}
     <motion.path 
      d="M12 16h4" 
      initial="normal" 
      animate={listControls} 
      variants={listVariants} 
      custom={0.3} 
     />
     
     {/* --- AKHIR TAMBAHAN --- */}
    </svg>
   </motion.div>
  );
 },
);

ClipboardListIcon.displayName = "ClipboardListIcon";
export { ClipboardListIcon };