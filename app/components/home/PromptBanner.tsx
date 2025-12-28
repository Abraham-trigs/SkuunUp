"use client";

import { motion } from "framer-motion";
import { FaHandPointDown } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function PromptBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const showDuration = 5000; // show for 5s
    const cycleDuration = 60000; // repeat every 60s

    const cycle = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), showDuration);
    };

    cycle();
    const interval = setInterval(cycle, cycleDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      // Fixed: Opacity must be between 0 and 1.
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="w-full bg-transparent text-center py-4 mt-4 pointer-events-none select-none"
    >
      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        // Updated to ark-deepblue for high-readability branding
        className="w-full text-xl md:text-2xl font-bold text-ark-deepblue tracking-tight"
      >
        View your child’s progress, anytime
      </motion.h2>

      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{
          delay: 1.2,
          duration: 0.6,
          repeat: visible ? Infinity : 0,
          repeatType: "reverse",
        }}
        // Updated to ark-red to draw attention to the prompt
        className="flex justify-center mt-2 text-ark-red"
      >
        <FaHandPointDown className="w-8 h-8 animate-bounce" />
      </motion.div>
    </motion.div>
  );
}
