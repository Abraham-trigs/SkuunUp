"use client";

import React, { useState, useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step4Schema } from "./schemas/step4Schema.ts";
import { z } from "zod";

export default function Step3PreviousSchools() {
  const {
    formData,
    setField,
    addPreviousSchool,
    removePreviousSchool,
    errors,
    setErrors,
    updateAdmission,
    loading,
  } = useAdmissionStore();

  const [localSchools, setLocalSchools] = useState(
    formData.previousSchools || []
  );

  useEffect(() => {
    setLocalSchools(formData.previousSchools || []);
  }, [formData.previousSchools]);

  const getError = (field: string, idx: number) => {
    const stepErrors = errors.updateAdmission || [];
    return stepErrors
      .filter((e) =>
        e
          .toLowerCase()
          .includes(`previousschools[${idx}].${field.toLowerCase()}`)
      )
      .map((e) => e.replace(`previousSchools[${idx}].${field}: `, ""));
  };

  const handleChange = async (idx: number, field: string, value: string) => {
    const updated = [...localSchools];
    updated[idx] = { ...updated[idx], [field]: value };
    setLocalSchools(updated);
    setField("previousSchools", updated);

    try {
      Step4Schema.parse({ previousSchools: updated });
      setErrors({});
      await updateAdmission({ previousSchools: updated }, 4);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        formattedErrors.updateAdmission = err.errors.map((e) => e.message);
        setErrors(formattedErrors);
      }
    }
  };

  const handleAddSchool = async () => {
    const newSchool = { name: "", location: "", startDate: "", endDate: "" };
    const updated = [...localSchools, newSchool];
    setLocalSchools(updated);
    setField("previousSchools", updated);
    addPreviousSchool(newSchool);

    try {
      await updateAdmission({ previousSchools: updated }, 4);
    } catch (err) {
      console.error("Failed to add previous school", err);
    }
  };

  const handleRemoveSchool = async (idx: number) => {
    const updated = localSchools.filter((_, i) => i !== idx);
    setLocalSchools(updated);
    setField("previousSchools", updated);
    removePreviousSchool(idx);

    try {
      await updateAdmission({ previousSchools: updated }, 4);
    } catch (err) {
      console.error("Failed to remove previous school", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-[var(--ford-primary)]">
        Step 3: Previous Schools
      </h2>

      {localSchools.map((school, idx) => (
        <div
          key={idx}
          className="bg-[var(--background)] p-4 rounded-xl border shadow-sm flex flex-col gap-3"
        >
          {["name", "location", "startDate", "endDate"].map((field) => (
            <div key={field} className="flex flex-col">
              <label
                htmlFor={`previousSchools-${idx}-${field}`}
                className="font-medium text-[var(--ford-primary)]"
              >
                {field
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </label>
              <input
                id={`previousSchools-${idx}-${field}`}
                type={field.includes("Date") ? "date" : "text"}
                value={school[field as keyof typeof school] || ""}
                onChange={(e) => handleChange(idx, field, e.target.value)}
                className={`w-full p-2 rounded border ${
                  getError(field, idx).length > 0
                    ? "border-red-600"
                    : "border-gray-300"
                } bg-[var(--background)] text-[var(--typo)]`}
                aria-invalid={getError(field, idx).length > 0}
                aria-describedby={
                  getError(field, idx).length > 0
                    ? `previousSchools-${idx}-${field}-error`
                    : undefined
                }
                disabled={loading}
              />
              {getError(field, idx).length > 0 && (
                <p
                  id={`previousSchools-${idx}-${field}-error`}
                  className="text-red-600 text-sm mt-1"
                >
                  {getError(field, idx).join(", ")}
                </p>
              )}
            </div>
          ))}

          <button
            type="button"
            className="text-red-600 font-medium mt-2 self-end"
            onClick={() => handleRemoveSchool(idx)}
            disabled={loading}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="px-4 py-2 bg-[var(--ford-secondary)] text-[var(--typo)] rounded hover:bg-[var(--ford-primary)] transition"
        onClick={handleAddSchool}
        disabled={loading}
      >
        + Add Previous School
      </button>
    </div>
  );
}
