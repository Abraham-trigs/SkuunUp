"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import { User, Home, Users } from "lucide-react";

export default function StepWardDetails() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* LEFT COLUMN: Living Situation */}
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
            Living Situation
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <User size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Profile Picture URL"
            value={formData.profilePicture || ""}
            onChangeValue={(v) => setField("profilePicture", v)}
            placeholder="https://image-url.com"
            className="pl-11"
          />
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Home size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Ward Lives With"
            value={formData.wardLivesWith || ""}
            onChangeValue={(v) => setField("wardLivesWith", v)}
            placeholder="e.g. Both Parents"
            className="pl-11"
          />
        </div>
      </div>

      {/* VERTICAL SEPARATOR */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#1c376e] opacity-50" />

      {/* RIGHT COLUMN: Sibling Info */}
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
            Family Hierarchy
          </span>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-[38px] pointer-events-none z-10 opacity-40 group-focus-within:opacity-100 transition-opacity">
            <Users size={16} style={{ color: "#6BE8EF" }} />
          </div>
          <LabeledInput
            label="Total Siblings"
            value={formData.numberOfSiblings?.toString() || ""}
            onChangeValue={(v) =>
              setField("numberOfSiblings", parseInt(v) || 0)
            }
            type="number"
            placeholder="0"
            className="pl-11"
          />
        </div>

        {/* Horizontal Split for Older/Younger */}
        <div className="grid grid-cols-2 gap-4">
          <LabeledInput
            label="Older"
            value={formData.siblingsOlder?.toString() || ""}
            onChangeValue={(v) => setField("siblingsOlder", parseInt(v) || 0)}
            type="number"
            placeholder="0"
            suffix="Siblings"
          />
          <LabeledInput
            label="Younger"
            value={formData.siblingsYounger?.toString() || ""}
            onChangeValue={(v) => setField("siblingsYounger", parseInt(v) || 0)}
            type="number"
            placeholder="0"
            suffix="Siblings"
          />
        </div>
      </div>
    </div>
  );
}
