"use client";
import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step6Schema } from "./schemas/step6Schema.ts";

export default function Step6Class() {
  const {
    formData,
    setField,
    availableClasses,
    fetchClasses,
    errors,
    setErrors,
  } = useAdmissionStore();

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const validateStep6 = () => {
    try {
      Step6Schema.parse(formData);
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrors({ updateAdmission: err.errors.map((e) => e.message) });
      }
      return false;
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Class & Admission
      </h2>

      <select
        className="w-full p-2 rounded border bg-[var(--background)] text-[var(--ford-primary)]"
        value={formData.classId || ""}
        onChange={(e) => setField("classId", e.target.value)}
      >
        <option value="">Select Class</option>
        {availableClasses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.grade} - {c.name}
          </option>
        ))}
      </select>
      {errors.updateAdmission?.some((e) => e.includes("classId")) && (
        <p className="text-red-600 text-sm">
          {errors.updateAdmission.find((e) => e.includes("classId"))}
        </p>
      )}
    </div>
  );
}
