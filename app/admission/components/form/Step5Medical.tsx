"use client";
import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step5Schema } from "./schemas/step5Schema.ts";

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
      {errors.updateAdmission?.some((e) => e.includes("medicalSummary")) && (
        <p className="text-red-600 text-sm">
          {errors.updateAdmission.find((e) => e.includes("medicalSummary"))}
        </p>
      )}

      <input
        className="w-full p-2 rounded border"
        placeholder="Blood Type"
        value={formData.bloodType || ""}
        onChange={(e) => setField("bloodType", e.target.value)}
      />
      {errors.updateAdmission?.some((e) => e.includes("bloodType")) && (
        <p className="text-red-600 text-sm">
          {errors.updateAdmission.find((e) => e.includes("bloodType"))}
        </p>
      )}

      <input
        className="w-full p-2 rounded border"
        placeholder="Special Disability"
        value={formData.specialDisability || ""}
        onChange={(e) => setField("specialDisability", e.target.value)}
      />
      {errors.updateAdmission?.some((e) => e.includes("specialDisability")) && (
        <p className="text-red-600 text-sm">
          {errors.updateAdmission.find((e) => e.includes("specialDisability"))}
        </p>
      )}
    </div>
  );
}
