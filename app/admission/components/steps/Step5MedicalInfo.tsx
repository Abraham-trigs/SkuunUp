"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import { Activity, Droplet, Accessibility } from "lucide-react";

export default function StepMedicalInfo() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* LEFT COLUMN: Core Medical Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: "#E74C3C" }}
          />
          <span
            style={{ color: "#BFCDEF" }}
            className="text-[10px] font-black uppercase tracking-widest opacity-60"
          >
            Vital Information
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Droplet size={16} style={{ color: "#E74C3C" }} />
          </div>
          <LabeledInput
            label="Blood Type"
            value={formData.bloodType || ""}
            onChangeValue={(v) => setField("bloodType", v)}
            placeholder="e.g. O Positive"
            className="pl-11"
          />
        </div>

        <div className="relative group pt-2">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Accessibility size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Special Disability"
            value={formData.specialDisability || ""}
            onChangeValue={(v) => setField("specialDisability", v)}
            placeholder="None / Specify disability"
            className="pl-11"
          />
        </div>
      </div>

      {/* VERTICAL SEPARATOR */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#1c376e] opacity-50" />

      {/* RIGHT COLUMN: Detailed Summary */}
      <div className="space-y-4 md:pl-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: "#6BE8EF" }}
          />
          <span
            style={{ color: "#BFCDEF" }}
            className="text-[10px] font-black uppercase tracking-widest opacity-60"
          >
            Health Summary
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Activity size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Medical Summary"
            value={formData.medicalSummary || ""}
            onChangeValue={(v) => setField("medicalSummary", v)}
            placeholder="Allergies, chronic conditions, etc."
            className="pl-11"
          />
        </div>

        {/* 2025 Health Badge */}
        <div
          style={{ backgroundColor: "#1c376e33" }}
          className="mt-10 p-4 rounded-xl border border-[#1c376e] border-dashed"
        >
          <p className="text-[10px] text-[#BFCDEF] opacity-50 leading-relaxed uppercase tracking-widest">
            * Confidential medical data. This information is strictly for
            administrative health records and emergency use.
          </p>
        </div>
      </div>
    </div>
  );
}
