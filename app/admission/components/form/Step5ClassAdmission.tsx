"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step6Schema } from "./schemas/step6Schema.ts";

// Export required fields for Step 6
export const Step6Fields = ["classId"];

export default function Step5ClassAdmission() {
  const {
    formData,
    setField,
    availableClasses,
    fetchClasses,
    errors,
    setErrors,
    updateAdmission,
    loading,
  } = useAdmissionStore();

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const getError = (field: string) =>
    errors.updateAdmission?.filter((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );

  const handleChange = async (value: string) => {
    setField("classId", value);

    try {
      Step6Schema.parse({ classId: value });
      setErrors({});
      await updateAdmission({ classId: value }, 6);
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
        Step 5: Class & Admission
      </h2>

      <select
        className={`w-full p-2 rounded border ${
          getError("classId") && getError("classId").length > 0
            ? "border-red-600"
            : "border-gray-300"
        } bg-[var(--background)] text-[var(--ford-primary)]`}
        value={formData.classId || ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        aria-invalid={!!getError("classId")?.length}
        aria-describedby={
          getError("classId") && getError("classId")?.length > 0
            ? "classId-error"
            : undefined
        }
      >
        <option value="">Select Class</option>
        {availableClasses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.grade} - {c.name}
          </option>
        ))}
      </select>

      {getError("classId") && getError("classId")?.length > 0 && (
        <p id="classId-error" className="text-red-600 text-sm mt-1">
          {getError("classId")?.join(", ")}
        </p>
      )}
    </div>
  );
}
