"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
  X,
} from "lucide-react";

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const features: Feature[] = [
  {
    id: 1,
    title: "Student Management",
    description: "Track enrollment, attendance, and academic performance.",
    icon: Users,
  },
  {
    id: 2,
    title: "Class Scheduling",
    description: "Automate timetable generation and conflict resolution.",
    icon: Calendar,
  },
  {
    id: 3,
    title: "Grade Reports",
    description: "Generate progress and report cards instantly.",
    icon: ClipboardList,
  },
  {
    id: 4,
    title: "Library System",
    description: "Manage books, lending, and digital resources.",
    icon: Book,
  },
  {
    id: 5,
    title: "Analytics",
    description: "Visualize trends in performance and attendance.",
    icon: BarChart3,
  },
];

export default function FeatureCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<Feature | null>(null);

  const doubledFeatures = [...features, ...features];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrame: number;
    const scrollSpeed = 0.8;

    scrollContainer.scrollLeft =
      scrollContainer.scrollWidth / 2 - scrollContainer.clientWidth / 2;

    const animate = () => {
      if (!paused) {
        scrollContainer.scrollLeft += scrollSpeed;

        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft -= scrollContainer.scrollWidth / 2;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [paused]);

  return (
    <section className="relative overflow-hidden py-12 bg-white">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar px-6 md:px-12 select-none"
      >
        {doubledFeatures.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelected(f);
                setPaused(true);
              }}
              // Fixed: changed flex-shrink-0 to shrink-0 to remove underline
              className="shrink-0 w-[80%] sm:w-[45%] md:w-[30%] lg:w-[22%] p-6 bg-ark-navy hover:bg-ark-deepblue rounded-2xl shadow-lg cursor-pointer transition-all border border-ark-lightblue/10"
            >
              <div className="flex flex-row items-center gap-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Icon className="w-8 h-8 text-ark-cyan" />
                </div>
                <h3 className="text-sm md:text-base font-bold text-white leading-tight">
                  {f.title}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Details Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Fixed: used standard z-50 to remove underline
            className="fixed inset-0 z-50 flex items-center justify-center bg-ark-navy/80 backdrop-blur-md p-4"
            onClick={() => {
              setSelected(null);
              setPaused(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="relative bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md text-center border-b-8 border-ark-red"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setSelected(null);
                  setPaused(false);
                }}
                className="absolute top-4 right-4 p-2 bg-ark-lightblue/20 rounded-full hover:bg-ark-red hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-ark-navy rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-ark-navy/20">
                <selected.icon className="w-10 h-10 text-ark-cyan" />
              </div>

              <h2 className="text-ark-navy text-2xl font-black mb-4 uppercase tracking-tight">
                {selected.title}
              </h2>
              <p className="text-ark-deepblue/80 font-medium leading-relaxed mb-6">
                {selected.description}
              </p>

              <button
                onClick={() => {
                  setSelected(null);
                  setPaused(false);
                }}
                className="w-full py-3 bg-ark-navy text-white font-bold rounded-xl hover:bg-ark-red transition-colors shadow-lg"
              >
                Close Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
