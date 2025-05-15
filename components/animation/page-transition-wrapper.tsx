"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

export function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname} // Use pathname for a stable key
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 flex flex-col" // Added flex-1 and flex-col to ensure it takes space like the original div
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 