"use client";

import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="text-7xl"
        >
          📋
        </motion.div>

        <h1 className="text-2xl font-bold text-fg-primary">
          Seu Planner está chegando
        </h1>

        <p className="text-fg-secondary max-w-md leading-relaxed">
          Estamos construindo uma experiência incrível de planejamento para
          você. Em breve, seus cards e blocos estarão aqui.
        </p>
      </motion.div>
    </div>
  );
}
