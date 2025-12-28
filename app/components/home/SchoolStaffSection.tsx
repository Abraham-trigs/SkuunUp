"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const staffData = [
  {
    name: "Hon. Clifford Martey Kortey",
    role: "Head of School / Principal",
    category: "Administration",
    image: "/proprietor.webp",
    bio: "Leads the school with vision, discipline, and compassion.",
  },
  {
    name: "Mrs. Ama Ofori",
    role: "Vice Principal / Academic",
    category: "Administration",
    image: "/vice-principal.webp",
    bio: "Oversees curriculum and ensures academic excellence.",
  },
  {
    name: "Mr. Kwame Mensah",
    role: "Vice Principal / Administration",
    category: "Administration",
    image: "/vice-principal-admin.webp",
    bio: "Manages school operations and administration.",
  },
  {
    name: "Ms. Akua Boateng",
    role: "Senior Teacher / Head of Department",
    category: "Teaching",
    image: "/senior-teacher.webp",
    bio: "Leads academic departments and mentors teachers.",
  },
  {
    name: "Mr. Kofi Asante",
    role: "Registrar",
    category: "Support",
    image: "/registrar.webp",
    bio: "Manages student records and enrollment.",
  },
  {
    name: "Mrs. Efua Nyarko",
    role: "Accountant / Finance Manager",
    category: "Support",
    image: "/accountant.webp",
    bio: "Ensures smooth financial operations of the school.",
  },
];

const categories = ["All", "Administration", "Teaching", "Support"];

export default function SchoolStaffSection() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredStaff =
    selectedCategory === "All"
      ? staffData
      : staffData.filter((s) => s.category === selectedCategory);

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-24 bg-white">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-ark-navy mb-4">
          Management Team
        </h2>
        <div className="w-20 h-1.5 bg-ark-red mx-auto mb-6 rounded-full" />
        <p className="text-ark-deepblue/70 font-semibold text-lg max-w-2xl mx-auto">
          Dedicated professionals leading Ford School into the 2025 academic
          year.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center gap-3 mb-16 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 transform active:scale-95 ${
              selectedCategory === cat
                ? "bg-ark-red text-white shadow-lg shadow-ark-red/20"
                : "bg-ark-lightblue/20 text-ark-navy hover:bg-ark-navy hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
      >
        <AnimatePresence mode="popLayout">
          {filteredStaff.map((staff, idx) => (
            <motion.div
              key={staff.name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="relative group bg-white rounded-3xl border border-ark-lightblue/30 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              {/* Category Tag */}
              <div className="absolute top-4 right-4 z-20 bg-ark-cyan text-ark-navy text-[10px] font-black uppercase px-3 py-1 rounded-full">
                {staff.category}
              </div>

              {/* Profile Image Container */}
              <div className="relative w-full h-72 overflow-hidden bg-ark-lightblue/10">
                <Image
                  src={staff.image}
                  alt={staff.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Visual Overlay on Hover */}
                <div className="absolute inset-0 bg-ark-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
                  <p className="text-white text-center text-sm font-medium leading-relaxed italic">
                    "{staff.bio}"
                  </p>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 text-center">
                <h3 className="font-black text-xl text-ark-navy mb-1 group-hover:text-ark-red transition-colors">
                  {staff.name}
                </h3>
                <p className="text-ark-deepblue font-bold text-sm">
                  {staff.role}
                </p>
              </div>

              {/* Red Bottom Bar Accent */}
              <div className="h-2 w-0 group-hover:w-full bg-ark-red transition-all duration-500" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
