"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const traitsData = [
  {
    name: "Leader",
    color: "text-white",
    bg: "bg-ark-navy",
    description: `As a Leader, Hon. Clifford Martey Kortey drives FORD School towards excellence.
He ensures that the school operates efficiently, inspires staff with clear vision, and sets high standards for academic and extracurricular achievements.
His leadership fosters a culture of accountability and innovation, guiding students to become responsible, future-ready citizens.
Parents and the community trust his direction, knowing that their children are in capable hands.`,
  },
  {
    name: "Proprietor",
    color: "text-white",
    bg: "bg-ark-deepblue",
    description: `As Proprietor, he oversees the school's overall operations and long-term strategy.
He ensures that all facilities, curriculum development, and teacher training meet top-notch standards.
His decisions impact students’ learning environment, enhance staff performance, and maintain the school's reputation among parents and the wider community.`,
  },
  {
    name: "Father",
    color: "text-white",
    bg: "bg-ark-red",
    description: `As a Father figure, Hon. Clifford Martey Kortey nurtures students individually, supporting their growth academically, socially, and emotionally.
He mentors teachers, offers guidance to parents, and creates a caring environment that values each child.
His presence instills a sense of safety, trust, and personal attention for every student at FORD School.`,
  },
  {
    name: "Friendly",
    color: "text-ark-navy",
    bg: "bg-ark-cyan",
    description: `Known for his Friendly nature, he is approachable to students, staff, and parents alike.
He maintains open communication channels with the community and encourages collaboration across all stakeholders.
His warmth and empathy strengthen relationships and make the school feel like a welcoming, inclusive family for everyone.`,
  },
];

export default function ProprietorSection() {
  const [activeTrait, setActiveTrait] = useState(traitsData[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative w-full bg-white py-24 overflow-hidden">
      {/* Brand Background Accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-ark-lightblue/10 -skew-x-12 translate-x-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center gap-16">
        {/* Image Container - Using standard scale units (w-72, h-96, w-96, h-128) to prevent editor underlines */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2 flex justify-center relative"
        >
          <div className="relative w-72 h-96 md:w-96 md:h-128 z-10">
            {/* Decorative Frame */}
            <div className="absolute -inset-4 border-2 border-ark-cyan rounded-3xl -rotate-3 z-0" />

            {/* The Image */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white z-10">
              <Image
                src="/proprietor.webp"
                alt="Hon. Clifford Martey Kortey"
                fill
                priority
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Subtle Glow */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-ark-red/10 rounded-full blur-2xl z-0" />
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-ark-red font-bold tracking-widest uppercase text-sm mb-2"
          >
            Visionary Leadership
          </motion.span>

          <h2 className="text-4xl md:text-5xl font-black text-ark-navy mb-2">
            Hon. Clifford Martey Kortey
          </h2>

          <p className="text-ark-deepblue/70 font-semibold mb-8 text-lg">
            Proprietor, FORD School Limited
          </p>

          {/* Traits Selector */}
          <div
            ref={containerRef}
            className="flex flex-wrap justify-center md:justify-start gap-3 mb-10"
          >
            {traitsData.map((trait) => {
              const isActive = activeTrait.name === trait.name;
              return (
                <button
                  key={trait.name}
                  onClick={() => setActiveTrait(trait)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${
                    isActive
                      ? `${trait.bg} ${trait.color} shadow-lg -translate-y-1`
                      : "bg-ark-lightblue/20 text-ark-navy hover:bg-ark-lightblue/40"
                  }`}
                >
                  {trait.name}
                </button>
              );
            })}
          </div>

          {/* Description Box */}
          <div className="min-h-64 w-full max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTrait.name}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 border-l-4 border-ark-cyan pl-6"
              >
                {activeTrait.description.split("\n").map((line, idx) => (
                  <p
                    key={idx}
                    className="text-ark-navy/80 leading-relaxed font-medium text-base md:text-lg"
                  >
                    {line}
                  </p>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
