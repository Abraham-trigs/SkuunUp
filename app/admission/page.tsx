// app/admission/page.tsx
"use client";

import dynamic from "next/dynamic";
import AuthGuard from "@/app/components/AuthGuard";

// Dynamically import the multi-step form to ensure client-only rendering
const MultiStepAdmissionForm = dynamic(
  () => import("./components/steps/MultiStepAdmissionForm.tsx"),
  { ssr: false }
);

export default function AdmissionPage() {
  return (
    <AuthGuard redirectOnFail>
      <main
        style={{ backgroundColor: "#03102b" }}
        className="min-h-screen py-12 lg:py-20 px-4 transition-colors duration-500"
      >
        <div className="max-w-5xl mx-auto">
          {/* Branded Header Section */}
          <header className="mb-12 text-center space-y-3">
            <h1
              style={{ color: "#BFCDEF" }}
              className="text-4xl lg:text-5xl font-black tracking-tighter uppercase"
            >
              Student Admission
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div
                className="h-1 w-12 rounded-full"
                style={{ backgroundColor: "#6BE8EF" }}
              />
              <p
                style={{ color: "#BFCDEF" }}
                className="text-xs font-bold uppercase tracking-[0.3em] opacity-60"
              >
                Enrollment Portal 2025
              </p>
              <div
                className="h-1 w-12 rounded-full"
                style={{ backgroundColor: "#6BE8EF" }}
              />
            </div>
          </header>

          {/* Glass-Card Form Container */}
          <section
            style={{
              backgroundColor: "#03102b",
              borderColor: "#1c376e",
              boxShadow: "0 25px 50px -12px rgba(107, 232, 239, 0.05)",
            }}
            className="relative border rounded-3xl p-6 md:p-10 lg:p-12 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[#6BE8EF]/10"
          >
            {/* Decorative Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6BE8EF]/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#E74C3C]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <MultiStepAdmissionForm />
            </div>
          </section>

          {/* Footer Utility */}
          <footer className="mt-8 text-center">
            <p
              style={{ color: "#BFCDEF" }}
              className="text-[10px] uppercase tracking-widest opacity-40"
            >
              Secured Academic Infrastructure • Powered by Ark Intelligence
            </p>
          </footer>
        </div>
      </main>
    </AuthGuard>
  );
}
