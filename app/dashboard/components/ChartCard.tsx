"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 250 }}
      style={{
        backgroundColor: "#03102b", // --color-ark-navy (Main Background)
        borderColor: "#1c376e", // --color-ark-deepblue (Subtle Border)
      }}
      className="p-4 md:p-6 lg:p-8 rounded-xl flex flex-col border shadow-2xl transition-all duration-300 hover:shadow-[#6BE8EF]/10"
    >
      <h3
        style={{ color: "#BFCDEF" }} // --color-ark-lightblue (Soft Title)
        className="font-bold text-lg mb-4 tracking-wide uppercase text-sm"
      >
        {title}
      </h3>

      <div
        className="flex-1 min-h-[300px] rounded-md"
        style={{ borderTop: "1px solid #1c376e" }} // Separator using Deep Blue
      >
        {children}
      </div>

      {/* Decorative Accent Line using Cyan */}
      <div
        className="h-1 w-12 mt-4 rounded-full"
        style={{ backgroundColor: "#6BE8EF" }}
      />
    </motion.div>
  );
}
