"use client";
import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { z } from "zod";
import { Step5Schema } from "./schemas/step5Schema.ts";

// Export required fields for Step 5
export const Step5Fields = ["medicalSummary", "bloodType", "specialDisability"];

export default function Step5Medical() {
  const { formData, setField, errors, setErrors } = useAdmissionStore();

  const validateStep5 = () => {
    try {
      Step5Schema.parse(formData);
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrors({ updateAdmission: err.errors.map((e) => e.message) });
      }
      return false;
    }
  };

  const getError = (field: string) =>
    errors.updateAdmission?.find((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Medical & Special Needs
      </h2>

      <input
        className="w-full p-2 rounded border"
        placeholder="Medical Summary"
        value={formData.medicalSummary || ""}
        onChange={(e) => setField("medicalSummary", e.target.value)}
      />
      {getError("medicalSummary") && (
        <p className="text-red-600 text-sm">{getError("medicalSummary")}</p>
      )}

      <input
        className="w-full p-2 rounded border"
        placeholder="Blood Type"
        value={formData.bloodType || ""}
        onChange={(e) => setField("bloodType", e.target.value)}
      />
      {getError("bloodType") && (
        <p className="text-red-600 text-sm">{getError("bloodType")}</p>
      )}

      <input
        className="w-full p-2 rounded border"
        placeholder="Special Disability"
        value={formData.specialDisability || ""}
        onChange={(e) => setField("specialDisability", e.target.value)}
      />
      {getError("specialDisability") && (
        <p className="text-red-600 text-sm">{getError("specialDisability")}</p>
      )}
    </div>
  );
}
