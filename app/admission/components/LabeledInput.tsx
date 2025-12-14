// app/admission/components/LabeledInput.tsx
"use client";

import React from "react";

interface LabeledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function LabeledInput({
  label,
  error,
  ...props
}: LabeledInputProps) {
  return (
    <div className="flex flex-col w-full mb-4">
      <label className="mb-1 text-gray-700 font-medium">{label}</label>
      <input
        {...props}
        className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <span className="text-red-600 text-xs mt-1">{error}</span>}
    </div>
  );
}
