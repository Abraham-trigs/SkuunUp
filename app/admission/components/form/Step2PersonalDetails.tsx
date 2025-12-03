"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { z } from "zod";
import { Step2Schema } from "./schemas/step2Schema.ts";

export default function Step2PersonalDetails() {
  const { formData, setField, errors, setErrors } = useAdmissionStore();

  // Utility to get error for a field (matches updateAdmission errors format)
  const getError = (field: string) =>
    (errors.updateAdmission || []).find((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );

  // Validate step (used internally or for future optional validation)
  const validateStep2 = () => {
    try {
      Step2Schema.parse(formData);
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrors({ updateAdmission: err.errors.map((e) => e.message) });
      }
      return false;
    }
  };

  // Fields for Step 2
  const stepFields = [
    { key: "surname", label: "Surname", type: "text" },
    { key: "firstName", label: "First Name", type: "text" },
    { key: "otherNames", label: "Other Names", type: "text" },
    { key: "dateOfBirth", label: "Date of Birth", type: "date" },
    { key: "nationality", label: "Nationality", type: "text" },
    { key: "sex", label: "Sex", type: "select", options: ["Male", "Female"] },
  ];

  return (
    <div className="space-y-4" aria-labelledby="step2-title">
      <h2
        id="step2-title"
        className="text-lg font-bold text-[var(--ford-primary)]"
      >
        Step 2: Personal Details
      </h2>

      {stepFields.map((field) => (
        <div key={field.key} className="flex flex-col">
          <label
            htmlFor={field.key}
            className="font-medium text-[var(--ford-primary)]"
          >
            {field.label}
          </label>

          {field.type === "select" ? (
            <select
              id={field.key}
              value={formData[field.key] || ""}
              onChange={(e) => setField(field.key, e.target.value)}
              className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.key}
              type={field.type}
              placeholder={`Enter ${field.label}`}
              value={formData[field.key] || ""}
              onChange={(e) => setField(field.key, e.target.value)}
              className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)] border"
            />
          )}

          {getError(field.key) && (
            <p className="text-red-600 text-sm">{getError(field.key)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
