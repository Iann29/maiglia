"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="relative">
        {/* Logo completa (estática) */}
        <Image
          src="/logo2semfolha.svg"
          alt="Maiglia"
          width={280}
          height={140}
          priority
        />

        {/* Folha animada sobreposta */}
        <motion.div
          className="absolute"
          style={{ top: -8, left: 128 }}
          animate={{
            y: [0, -6, 0],
            rotate: [0, 4, -4, 0],
          }}
          transition={{
            y: {
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            },
            rotate: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <Image
            src="/maiglia-leaf.svg"
            alt=""
            width={44}
            height={54}
            priority
          />
        </motion.div>
      </div>
    </div>
  );
}
