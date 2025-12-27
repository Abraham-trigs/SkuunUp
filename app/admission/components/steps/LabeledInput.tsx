"use client";

import React from "react";
import { AlertCircle } from "lucide-react"; // Optional: for error icon

interface LabeledInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  error?: string;
  onChangeValue?: (value: string) => void;
  suffix?: string;
}

export default function LabeledInput({
  label,
  error,
  onChangeValue,
  suffix,
  ...props
}: LabeledInputProps) {
  return (
    <div className="flex flex-col w-full mb-5 group">
      {/* Sleek Label */}
      <label
        style={{ color: "#BFCDEF" }}
        className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] opacity-70 group-focus-within:opacity-100 transition-opacity"
      >
        {label}
      </label>

      <div className="relative w-full">
        <input
          {...props}
          onChange={(e) => onChangeValue?.(e.target.value)}
          style={{
            backgroundColor: "#1c376e", // Deep Blue
            color: "#BFCDEF",
          }}
          className={`
            w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none
            placeholder:text-white/20
            ${suffix ? "pr-16" : ""}
            ${
              error
                ? "border-[#E74C3C] bg-[#E74C3C]/5 focus:ring-2 focus:ring-[#E74C3C]/50"
                : "border-[#BFCDEF]/10 focus:ring-2 focus:ring-[#6BE8EF] focus:border-transparent shadow-inner"
            }
          `}
        />

        {/* Suffix Branding */}
        {suffix && (
          <span
            style={{ color: "#6BE8EF" }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none opacity-60"
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Error Message with Icon */}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} className="text-[#E74C3C]" />
          <span className="text-[#E74C3C] text-[10px] font-bold uppercase tracking-wider">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
