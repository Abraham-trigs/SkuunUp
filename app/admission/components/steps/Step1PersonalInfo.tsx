"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";
import { ChevronDown, Globe } from "lucide-react";

const countries = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "United States",
  "United Kingdom",
  "Canada",
  "India",
  "Australia",
  "Other",
];

export default function StepPersonalInfo() {
  const { formData, setField } = useAdmissionStore();

  useEffect(() => {
    if (!formData.nationality) {
      setField("nationality", "Ghana");
    }
  }, [formData.nationality, setField]);

  const handleDropdownChange = (value: string) => {
    if (value === "Other") {
      setField("nationality", "");
    } else {
      setField("nationality", value);
    }
  };

  const isOtherSelected =
    !countries.includes(formData.nationality || "") &&
    formData.nationality !== "";
  const currentDropdownValue = countries.includes(formData.nationality || "")
    ? formData.nationality
    : "Other";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date of Birth Input */}
      <LabeledInput
        label="Date of Birth"
        type="date"
        value={
          formData.dateOfBirth
            ? new Date(formData.dateOfBirth).toISOString().split("T")[0]
            : ""
        }
        onChangeValue={(v: string) =>
          setField("dateOfBirth", v ? new Date(v).toISOString() : "")
        }
      />

      {/* Nationality Selection Container */}
      <div className="flex flex-col group">
        <label
          style={{ color: "#BFCDEF" }}
          className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70 group-focus-within:opacity-100 transition-opacity"
        >
          Nationality
        </label>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Globe
              size={16}
              style={{ color: "#6BE8EF" }}
              className="opacity-40"
            />
          </div>

          <select
            id="nationality"
            value={currentDropdownValue}
            onChange={(e) => handleDropdownChange(e.target.value)}
            style={{
              backgroundColor: "#1c376e",
              color: "#BFCDEF",
              borderColor: "#BFCDEF33",
            }}
            className="w-full appearance-none rounded-xl border pl-11 pr-10 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#6BE8EF] outline-none cursor-pointer"
          >
            <option value="" disabled className="bg-[#03102b]">
              Select nationality
            </option>
            {countries.map((country) => (
              <option key={country} value={country} className="bg-[#03102b]">
                {country}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            style={{ color: "#6BE8EF" }}
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        {/* Dynamic Input for "Other" Nationality */}
        {(isOtherSelected || currentDropdownValue === "Other") && (
          <div className="mt-4 animate-in zoom-in-95 duration-200">
            <LabeledInput
              label="Specify Nationality"
              value={formData.nationality || ""}
              onChangeValue={(v: string) => setField("nationality", v)}
              placeholder="e.g. Brazilian"
            />
          </div>
        )}
      </div>
    </div>
  );
}
