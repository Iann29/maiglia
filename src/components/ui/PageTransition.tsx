"use client";

import { motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Componente de transição de página com animação suave
 * Usa framer-motion para fade-in simples (sem exit animation para evitar flicker)
 */
export function PageTransition({ children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
