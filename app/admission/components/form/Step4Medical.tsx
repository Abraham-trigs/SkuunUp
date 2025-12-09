"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step5Schema } from "./schemas/step5Schema.ts";

// Export required fields for Step 5
export const Step5Fields = ["medicalSummary", "bloodType", "specialDisability"];

export default function Step4Medical() {
  const { formData, setField, errors, setErrors, updateAdmission, loading } =
    useAdmissionStore();

  const getError = (field: string) =>
    errors.updateAdmission?.filter((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );

  const stepFields = [
    { key: "medicalSummary", placeholder: "Medical Summary", type: "text" },
    { key: "bloodType", placeholder: "Blood Type", type: "text" },
    {
      key: "specialDisability",
      placeholder: "Special Disability",
      type: "text",
    },
  ];

  const handleChange = async (key: string, value: string) => {
    setField(key, value);

    try {
      Step5Schema.parse({ [key]: value });
      setErrors({});
      await updateAdmission({ [key]: value }, 5);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        formattedErrors.updateAdmission = err.errors.map((e) => e.message);
        setErrors(formattedErrors);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Step 4: Medical & Special Needs
      </h2>

      {stepFields.map((field) => {
        const fieldErrors = getError(field.key);
        return (
          <div key={field.key} className="flex flex-col">
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`w-full p-2 rounded border ${
                fieldErrors && fieldErrors.length > 0
                  ? "border-red-600"
                  : "border-gray-300"
              }`}
              disabled={loading}
              aria-invalid={!!fieldErrors?.length}
              aria-describedby={
                fieldErrors && fieldErrors.length > 0
                  ? `${field.key}-error`
                  : undefined
              }
            />
            {fieldErrors && fieldErrors.length > 0 && (
              <p
                id={`${field.key}-error`}
                className="text-red-600 text-sm mt-1"
              >
                {fieldErrors.join(", ")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
