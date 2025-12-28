"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Leaf, Users, BookOpen, Heart, X } from "lucide-react";

const qualities = [
  {
    icon: <Leaf className="w-8 h-8 text-ark-cyan" />,
    title: "Sound Environment",
    description:
      "FORD provides a serene and secure learning atmosphere that inspires focus, confidence, and curiosity.",
    image: "/quality1.webp",
  },
  {
    icon: <Users className="w-8 h-8 text-ark-cyan" />,
    title: "Expert Teachers",
    description:
      "Our dedicated educators blend deep subject mastery with empathy, ensuring every student feels seen and supported.",
    image: "/quality2.webp",
  },
  {
    icon: <BookOpen className="w-8 h-8 text-ark-cyan" />,
    title: "Modern Learning",
    description:
      "Interactive lessons, digital resources, and practical sessions connect classroom concepts to real-world applications.",
    image: "/quality3.webp",
  },
  {
    icon: <Heart className="w-8 h-8 text-ark-cyan" />,
    title: "Holistic Growth",
    description:
      "Beyond academics, students develop leadership, creativity, and social values for life beyond school walls.",
    image: "/quality4.webp",
  },
];

export default function QualitiesSection() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-6xl px-6 md:px-10 py-24 text-center bg-white">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-black text-ark-navy mb-4">
          Qualities of Education with FORD
        </h2>
        <div className="w-24 h-1.5 bg-ark-red mx-auto mb-6 rounded-full" />
        <p className="max-w-2xl mx-auto text-ark-deepblue/80 font-medium text-base md:text-lg">
          At FORD School Limited, education is more than instruction — it’s an
          experience built on values that shape lifelong learners and future
          leaders.
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {qualities.map((item, index) => (
          <motion.div
            key={index}
            layoutId={`card-${index}`}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
            className="group flex flex-col items-center bg-white border-2 border-ark-lightblue/30 hover:border-ark-cyan rounded-3xl shadow-xl hover:shadow-ark-cyan/10 p-8 text-center cursor-pointer transition-colors duration-300"
            onClick={() => setSelected(index)}
          >
            <div className="mb-6 p-4 rounded-2xl bg-ark-navy group-hover:bg-ark-red transition-colors duration-300">
              {item.icon}
            </div>
            <h3 className="font-bold text-xl mb-3 text-ark-navy">
              {item.title}
            </h3>
            <p className="text-sm text-ark-deepblue/70 leading-relaxed font-medium">
              {item.description}
            </p>
            <div className="mt-4 text-ark-red font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              View Details
            </div>
          </motion.div>
        ))}
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-ark-navy/90 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={`card-${selected}`}
              className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 bg-ark-red text-white p-2 rounded-xl hover:bg-ark-navy transition-colors shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Image Area */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                  <Image
                    src={qualities[selected].image}
                    alt={qualities[selected].title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Content Area */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-left">
                  <div className="inline-block p-3 rounded-xl bg-ark-navy mb-4 w-fit">
                    {qualities[selected].icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-4 text-ark-navy">
                    {qualities[selected].title}
                  </h3>
                  <p className="text-base md:text-lg text-ark-deepblue/80 leading-relaxed font-medium mb-6">
                    {qualities[selected].description}
                  </p>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-full md:w-fit bg-ark-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-ark-red transition-colors shadow-lg"
                  >
                    Close Discovery
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
