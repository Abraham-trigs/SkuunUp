// app/admission/components/LabeledInput.tsx
// Purpose: Accessible, reusable input with label, error display, normalized onChange, and optional suffix.

"use client";

import React from "react";

interface LabeledInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  error?: string;
  /** Returns the input value directly instead of the event object */
  onChangeValue?: (value: string) => void;
  /** Optional suffix displayed inside the input */
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
    <div className="flex flex-col w-full mb-4">
      <label className="mb-1 text-gray-700 font-medium">{label}</label>
      <div className="relative w-full">
        <input
          {...props}
          onChange={(e) => onChangeValue?.(e.target.value)}
          className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${
            suffix ? "pr-20" : ""
          } ${error ? "border-red-500" : "border-gray-300"}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <span className="text-red-600 text-xs mt-1">{error}</span>}
    </div>
  );
}
