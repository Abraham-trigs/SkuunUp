"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import { MapPin, Phone, AlertTriangle, ShieldAlert } from "lucide-react";

export default function StepContactEmergency() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* LEFT COLUMN: Primary Contact */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: "#6BE8EF" }}
          />
          <span
            style={{ color: "#BFCDEF" }}
            className="text-[10px] font-black uppercase tracking-widest opacity-60"
          >
            Primary Location & Contact
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <MapPin size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Postal Address"
            value={formData.postalAddress || ""}
            onChangeValue={(v) => setField("postalAddress", v)}
            placeholder="P.O. Box / Digital Address"
            className="pl-11"
          />
        </div>

        <LabeledInput
          label="Residential Address"
          value={formData.residentialAddress || ""}
          onChangeValue={(v) => setField("residentialAddress", v)}
          placeholder="Hse No / Street Name"
        />

        <div className="relative group pt-2">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Phone size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Ward Mobile"
            value={formData.wardMobile || ""}
            onChangeValue={(v) => setField("wardMobile", v)}
            placeholder="+233 XX XXX XXXX"
            className="pl-11"
          />
        </div>
      </div>

      {/* VERTICAL SEPARATOR */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#1c376e] opacity-50" />

      {/* RIGHT COLUMN: Emergency Information */}
      <div className="space-y-4 md:pl-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: "#E74C3C" }}
          />
          <span
            style={{ color: "#BFCDEF" }}
            className="text-[10px] font-black uppercase tracking-widest opacity-60"
          >
            Emergency Protocols
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <AlertTriangle size={16} style={{ color: "#E74C3C" }} />
          </div>
          <LabeledInput
            label="Emergency Contact"
            value={formData.emergencyContact || ""}
            onChangeValue={(v) => setField("emergencyContact", v)}
            placeholder="Primary Emergency Person"
            className="pl-11"
          />
        </div>

        <div className="relative group pt-2">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <ShieldAlert size={16} style={{ color: "#E74C3C" }} />
          </div>
          <LabeledInput
            label="Emergency Medical Contact"
            value={formData.emergencyMedicalContact || ""}
            onChangeValue={(v) => setField("emergencyMedicalContact", v)}
            placeholder="Doctor / Clinic Info"
            className="pl-11"
          />
        </div>

        {/* 2025 Info Badge */}
        <div
          style={{ backgroundColor: "#1c376e33" }}
          className="mt-6 p-4 rounded-xl border border-[#1c376e] border-dashed"
        >
          <p className="text-[10px] text-[#BFCDEF] opacity-50 leading-relaxed uppercase tracking-tighter">
            * Ensure emergency numbers are reachable 24/7. These contacts will
            be prioritized during critical incidents.
          </p>
        </div>
      </div>
    </div>
  );
}
